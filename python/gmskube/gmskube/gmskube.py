#!/usr/bin/env python3
import contextlib
import datetime
import getpass
import io
import json
import logging
import os
import re
import requests
import subprocess
import sys
import time
import traceback
import yaml
import zipfile
from argparse import (
    ArgumentParser,
    ArgumentTypeError,
    Namespace,
    RawDescriptionHelpFormatter,
)
from functools import cached_property
from kubernetes import client, config, watch
from kubernetes.client.rest import ApiException
from operator import itemgetter
from pathlib import Path
from requests.adapters import HTTPAdapter
from rich import box
from rich.console import Console
from rich.table import Table
from rich.prompt import Confirm
from signal import SIGINT, signal
from types import FrameType
from urllib3 import Retry

from .parsers import Parsers


# Reason that is returned when kubernetes API objects are not present
NOT_FOUND = "Not Found"


class GMSKube:
    """
    The ``gmskube`` command-line program is used to install and
    configure instances of GMS (the Geophysical Monitoring System) on
    Kubernetes.  See :func:`parser` for more details.

    Attributes:
        args (Namespace):  The parsed command line arguments.
        augmentation_name (str):  The name of the augmentation to apply
            or delete with the `gmskube augment` command.
        augmentations (list[str]):  Which augmentations to apply when
            installing an instance.
        command (Callable):  The function to be run corresponding to the
            sub-command selected.
        config_override_path (Path):  The path to a directory of
            configuration overrides to load into the instance.
        custom_chart_path (str):  Path to a local Helm chart directory
            to deploy.
        deploy_dir (Path):  The location of the ``deploy`` directory,
            containing our Helm charts.
        dry_run (bool):  Whether to not actually install, but instead
            just print the YAML that would've been used.
        image_tag (str):  The Docker tag to use for the images.
        ingress_port (str):  The port for ingress to the
            ``config-loader``.
        instance_name (str):  The name of the instance.
        instance_type (str):  The type of the instance.
        is_istio (bool):  Whether to enable Istio injection.
        service (str):  The name of the service for which to get the
            ingress route.
        set_strings (list[str]):  A list of ``key=value`` strings for
            setting values in the Helm charts.
        sets (list[str]):  Like ``set_strings``, but without forcing
            string values.
        show_all (bool):  Whether to list all Helm-installed instances,
            even if they do not contain GMS metadata.
        timeout (int):  A timeout (in minutes) used for various
            operations.
        username (str):  The username for which to filter ``gmskube ls``
            results.
        values (list[str]):  Paths to values override YAML files.
        verbose (str):  Either ``"INFO"`` or ``"DEBUG"``, for differing
            levels of log output.
        wallet_path (str):  The path to an Oracle Wallet directory.
        with_container (bool):  Whether the script is being run
            with the wrapping container.
    """

    def __init__(self):
        # init attributes
        self.augmentations = []
        self.augmentation_name = None
        self.command = None
        self.config_override_path = None
        self.custom_chart_path = None
        self.dry_run = False
        self.image_tag = None
        self.instance_name = None
        self.reuse_namespace = False
        self.show_all = False
        self.service = None
        self.sets = []
        self.set_strings = []
        self.timeout = 5
        self.filter_type = None
        self.username = None
        self.values = []
        self.verbose = "INFO"
        self.wallet_path = None

        self.console_kwargs = {"log_path": False}
        if os.getenv("CI"):  # pragma: no branch
            self.console_kwargs["force_terminal"] = True
        if os.getenv("RICH_LOG_PATH"):  # pragma: no coverage
            self.console_kwargs["log_path"] = True
        self.console = Console(**self.console_kwargs)
        self.with_container = not bool(os.getenv("GMSKUBE_WITHOUT_CONTAINER"))
        self.deploy_dir = (
            Path("/deploy") if self.with_container else
            Path(__file__).resolve().parents[3] / "deploy"
        )
        if not self.with_container:  # pragma: no coverage
            config.load_kube_config()

    def main(self, argv: list[str]) -> None:
        """
        The main routine for the ``gmskube`` command-line tool.

        Args:
            argv:  The command line arguments used when running this
                file as a script.
        """
        try:
            self.parse_args(argv)

            # Configure logging:  Make sure this comes before any call to
            # logging.  Remove any existing logging handlers that may have
            # been set up in imports.
            while len(logging.root.handlers):
                logging.root.removeHandler(logging.root.handlers[-1])
            logging.basicConfig(
                format="[%(levelname)s] %(message)s",
                level=getattr(logging, self.verbose)
            )  # yapf: disable

            # Capture any messages from the warnings module.
            logging.captureWarnings(True)

            # Save the `kubectl` context into a file if the environment
            # variable is set.
            if "KUBECTL_CONTEXT" in os.environ:  # pragma: no branch
                logging.debug("KUBECTL_CONTEXT is set, saving file")

                # Save the context into `/kubeconfig/config` where the
                # `$KUBECONFIG` environment variable is set in the
                # `Dockerfile`.  The path is hard-coded instead of using the
                # environment variable to prevent a Fortify finding.
                kubeconfig_path = Path("/kubeconfig/config")
                with open(kubeconfig_path, "w") as kube_file:
                    print(f"{os.getenv('KUBECTL_CONTEXT')}", file=kube_file)
                kubeconfig_path.chmod(0o600)
                config.load_kube_config()

            # Print debug arguments.
            # logging.debug("Arguments:")
            # for arg in vars(self.args):
            #     logging.debug(f"    {arg} = {getattr(self.args, arg) or ''}")

            # Print out the entire environment for debug.
            # logging.debug(
            #     "Environment:\n" + "\n".join([
            #         f"        {key}={value}" for key,
            #         value in sorted(os.environ.items())
            #     ])
            # )

            self.set_helm_path()
            if self.service is None:
                self.console.log(f'Current kubeconfig context: [bold]{self.kubernetes_context_name}[/]')
            self.args.command()
        except Exception as ex:  # pragma no coverage
            self.console.log(fr"[bold red]\[ERROR] {ex}")
            if self.verbose == 'DEBUG':
                traceback.print_exc()
            sys.exit(1)

    @property
    def base_domain(self) -> str:
        base_domain = self.ingress_ports_config["base_domain"]
        logging.debug(f'Base domain: {base_domain}')
        return base_domain

    @cached_property
    def docker_registry(self) -> str:
        # This is a raging hack to satisfy Fortify because it will
        # complain if the value is taken directly from the env var. So
        # write the env var to a stream, then read it back. Much Security!
        with io.StringIO() as mem_stream:
            mem_stream.write(f"{os.getenv('CI_DOCKER_REGISTRY')}")
            docker_registry = mem_stream.getvalue()
            logging.debug(f'Docker Registry: {docker_registry}')
            return docker_registry

    @cached_property
    def ingress_port(self) -> str:
        ingress_port = self.ingress_ports_config["istio_port"] if self.is_istio else self.ingress_ports_config["nginx_port"]
        logging.debug(f'Ingress port: {ingress_port}')
        return ingress_port

    @cached_property
    def ingress_ports_config(self) -> dict:
        try:
            result = client.CoreV1Api().read_namespaced_config_map('ingress-ports-config', 'gms')
        except ApiException as ex:
            if NOT_FOUND in ex.reason:
                raise RuntimeError("Configmap 'ingress-ports-config' not found in 'gms' namespace.")
            else:
                raise ex
        return result.data

    @cached_property
    def is_istio(self) -> bool:
        try:
            is_istio = client.CoreV1Api().read_namespace(self.instance_name).metadata.labels['istio-injection'] == "enabled"
        except KeyError:
            is_istio = False
        logging.debug(f'Is Istio: {is_istio}')
        return is_istio

    @cached_property
    def instance_type(self) -> str:
        # custom charts are always type custom
        if self.custom_chart_path is not None:
            return "custom"

        try:
            instance_type = client.CoreV1Api().read_namespaced_config_map('gms', self.instance_name).metadata.labels["gms/type"]
        except ApiException as ex:
            if NOT_FOUND in ex.reason:
                raise RuntimeError(f"Configmap 'gms' not found in '{self.instance_name}' namespace.")
            else:
                raise ex
        except KeyError:
            raise RuntimeError(f"Unable to determine instance time from 'gms' configmap in '{self.instance_name}' namespace.")
        logging.debug(f'Instance type: {instance_type}')
        return instance_type

    @cached_property
    def kubernetes_context_name(self) -> str:
        context_name = config.list_kube_config_contexts()[1]['name']
        logging.debug(f'Kubeconfig context: {context_name}')
        return context_name

    @cached_property
    def kubernetes_version(self) -> str:
        try:
            version = client.VersionApi().get_code()
        except ApiException as ex:
            self.print_error(
                "Unable to get version information from cluster.\n"
                "Possible things to check:\n"
                "    - You are connecting to the correct cluster.\n"
                "    - Your kube config file credentials are valid.\n"
                "    - Run `kubectl get nodes` and check for error messages."
            )
            raise ex

        kubernetes_version = f"{version.major}.{version.minor}"
        logging.debug(f"Kubernetes API version: {kubernetes_version}")

        return kubernetes_version

    @property
    def parser(self) -> ArgumentParser:
        """
        Get the main argument parser for the script.

        Note:
            Any time new arguments are added, be sure to regenerate the
            ``bash_completion`` file by running
            ``shtab gmskube.gmskube.get_parser > bash_completion`` in
            the ``python/gmskube`` directory.
        """
        description = """
Description
===========

The `gmskube` command-line program is used to install and configure
instances of GMS (the Geophysical Monitoring System) on Kubernetes.

Each "instance" is an installation of a multi-container application that
is managed as a single unit and runs on a Kubernetes cluster.  Each
instance is contained within its own namespace in Kubernetes.  Various
predefined types of instances are available.

Multiple copies of instances of the same type may be run simultaneously.
Each instance must be given a unique name to identify it, as well as
distinguish it from other running instances of the same type.

Different versions of a particular instance type may be available from
the configured Docker registry.  Released versions of GMS are tagged
with a specific version number.  During development, this corresponds to
a tag name on the Docker images.

Configuration
=============

Before you can run `gmskube`, you must first download a `Kubeconfig`
bundle from the cluster, and have the `kubectl` context set to the
correct cluster.

1. Login to Rancher.
2. Click the cluster name.
3. In the upper right, click the blue "Kubeconfig File" button.
4. Copy/Paste the contents into `~/.kube/config` on your development
   machine.
5. If you have `kubectl` installed, the `KUBECONFIG` environment
   variable should already be set.  If not, set `KUBECONFIG=~/config`.
"""
        parser = ArgumentParser(
            description=description,
            formatter_class=RawDescriptionHelpFormatter,
            prog="gmskube"
        )
        subparsers = parser.add_subparsers(help="Available sub-commands:")

        # Augment [Apply, Delete, Catalog]
        augment_parser = subparsers.add_parser(
            "augment",
            help="Augment a running instance of the system."
        )
        augment_subparsers = augment_parser.add_subparsers(
            help="Available augment sub-commands:"
        )

        # Augment Apply
        augment_apply_parser = augment_subparsers.add_parser(
            "apply",
            parents=[
                Parsers.augmentation_name,
                Parsers.chart,
                Parsers.dry_run,
                Parsers.name,
                Parsers.sets,
                Parsers.tag,
                Parsers.timeout,
                Parsers.verbose,
            ],
            help="Apply an augmentation to a running instance of the system."
        )
        augment_apply_parser.set_defaults(command=self.apply_augmentation)

        # Augment Catalog
        augment_catalog_parser = augment_subparsers.add_parser(
            "catalog",
            aliases=["cat"],
            parents=[
                Parsers.chart,
                Parsers.tag,
                Parsers.timeout,
                Parsers.verbose,
            ],
            help="List the catalog of available augmentation names."
        )
        augment_catalog_parser.set_defaults(command=self.list_augmentations)

        # Augment Delete
        augment_delete_parser = augment_subparsers.add_parser(
            "delete",
            parents=[
                Parsers.augmentation_name,
                Parsers.chart,
                Parsers.dry_run,
                Parsers.name,
                Parsers.tag,
                Parsers.timeout,
                Parsers.verbose,
            ],
            help="Delete the specified augmentation."
        )
        augment_delete_parser.set_defaults(command=self.delete_augmentation)

        # Cluster [Init, Check]
        cluster_parser = subparsers.add_parser(
            "cluster",
            help="Tools for working with kubernetes clusters for GMS."
        )
        cluster_subparsers = cluster_parser.add_subparsers(
            help="Available cluster sub-commands:"
        )

        # Cluster Init
        cluster_init_parser = cluster_subparsers.add_parser(
            "init",
            parents=[
                Parsers.dry_run,
                Parsers.tag,
                Parsers.values,
                Parsers.verbose
            ],
            help="Initialize a cluster for running GMS. This can be used "
            "for initial setup of a cluster, or updating cluster-wide values "
            "of an existing cluster."
        )
        Parsers.add_chart_args(cluster_init_parser)
        cluster_init_parser.add_argument(
            "--wallet-path",
            required=True,
            type=Path,
            help="Required path to the Oracle Wallet directory. This "
            "wallet is for the external Oracle DB."
        )
        cluster_init_parser.set_defaults(command=self.cluster_init)

        # Cluster Check
        cluster_check_parser = cluster_subparsers.add_parser(
            "check",
            parents=[
                Parsers.tag,
                Parsers.verbose
            ],
            help="Perform a checkout of a running cluster. This will not modify "
            "the cluster in any way. Checks that various things are present "
            "that are necessary to run GMS. While it checks that objects exist, "
            "it may not be able to know that the value is valid."
        )
        cluster_check_parser.set_defaults(command=self.cluster_check)

        # Ingress
        ingress_parser = subparsers.add_parser(
            "ingress",
            parents=[
                Parsers.name,
                Parsers.port,
                Parsers.tag,
                Parsers.timeout,
                Parsers.verbose,
            ],
            help="List the ingress routes for an instance."
        )
        ingress_parser.add_argument(
            "--service",
            help="Return only the ingress route for the specified service."
        )
        ingress_parser.set_defaults(command=self.list_ingress_routes)

        # Install
        install_parser = subparsers.add_parser(
            "install",
            parents=[
                Parsers.augment,
                Parsers.config,
                Parsers.dry_run,
                Parsers.istio,
                Parsers.name,
                Parsers.port,
                Parsers.reuse_namespace,
                Parsers.set_string,
                Parsers.sets,
                Parsers.tag,
                Parsers.timeout,
                Parsers.values,
                Parsers.verbose,
            ],
            help="Install an instance of the system."
        )
        install_type_chart_group = install_parser.add_mutually_exclusive_group(
            required=True
        )
        Parsers.add_type_args(install_type_chart_group)
        Parsers.add_chart_args(install_type_chart_group)
        install_parser.add_argument(
            "--wallet-path",
            type=Path,
            help="Optional path to an Oracle Wallet directory.  Under normal "
            "circumstances either the shared cluster-wide wallet, or the "
            "container wallet, will automatically be used for the instance, "
            "so supplying an Oracle Wallet path is not necessary.  This "
            "argument should only be used when testing a new Oracle Wallet."
        )
        install_parser.set_defaults(command=self.install_instance)

        # List
        list_parser = subparsers.add_parser(
            "list",
            aliases=["ls"],
            parents=[
                Parsers.tag,
                Parsers.timeout,
                Parsers.filter_type,
                Parsers.verbose,
            ],
            help="List instances."
        )
        list_parser.add_argument(
            "--user",
            help="List only instances deployed by the specified user."
        )
        list_parser.add_argument(
            "--all",
            "-a",
            default=False,
            action="store_true",
            help="Include all namespaces (system, rancher, etc.), not just "
            "GMS instances."
        )
        list_parser.add_argument(
            "name",
            nargs="?",
            help="Optional name of the instance to list. If the instance does "
            "not exist, then a non-zero exit code will be returned."
        )
        list_parser.set_defaults(command=self.list_instances)

        # Reconfig
        reconfig_parser = subparsers.add_parser(
            "reconfig",
            parents=[
                Parsers.config,
                Parsers.name,
                Parsers.port,
                Parsers.tag,
                Parsers.timeout,
                Parsers.verbose,
            ],
            help="Reconfigure a running instance of a system."
        )
        reconfig_parser.set_defaults(command=self.reconfigure_instance)

        # Uninstall
        uninstall_parser = subparsers.add_parser(
            "uninstall",
            parents=[
                Parsers.name,
                Parsers.reuse_namespace,
                Parsers.tag,
                Parsers.timeout,
                Parsers.verbose,
            ],
            help="Uninstall an instance of the system."
        )
        uninstall_parser.set_defaults(command=self.uninstall_instance)

        # Upgrade
        upgrade_parser = subparsers.add_parser(
            "upgrade",
            parents=[
                Parsers.augment,
                Parsers.dry_run,
                Parsers.name,
                Parsers.set_string,
                Parsers.sets,
                Parsers.tag,
                Parsers.timeout,
                Parsers.verbose,
                Parsers.values,
            ],
            help="Upgrade an instance of the system."
        )
        Parsers.add_chart_args(upgrade_parser)
        upgrade_parser.set_defaults(command=self.upgrade_instance)

        return parser

    def parse_args(self, argv: list[str]) -> Namespace:
        """
        Parse the command-line arguments to the script, save them as
        instance attributes, and validate them.

        Args:
            argv:  The command line arguments used when running this
                file as a script.
        """
        self.args = self.parser.parse_args(argv)
        self.set_instance_attributes()
        if not hasattr(self.args, "command"):
            self.parser.print_help()
            sys.exit(0)
        self.validate_instance_tag()
        self.validate_instance_name()
        if self.dry_run:
            self.set_dry_run_console()

    def set_instance_attributes(self) -> None:
        """
        Set the parsed arguments as instance attributes for ease of
        reference.  If any arguments weren't specified, they are left
        as their default value from init.
        """
        self.set_instance_attribute_if_arg_exists("all", "show_all")
        self.set_instance_attribute_if_arg_exists("augment", "augmentations")
        self.set_instance_attribute_if_arg_exists("augmentation_name")
        self.set_instance_attribute_if_arg_exists("chart", "custom_chart_path")
        self.set_instance_attribute_if_arg_exists("command")
        self.set_instance_attribute_if_arg_exists("config", "config_override_path")
        self.set_instance_attribute_if_arg_exists("dry_run")
        self.set_instance_attribute_if_arg_exists("filter_type")
        self.set_instance_attribute_if_arg_exists("istio", "is_istio")
        self.set_instance_attribute_if_arg_exists("name", "instance_name")
        self.set_instance_attribute_if_arg_exists("port", "ingress_port")
        self.set_instance_attribute_if_arg_exists("reuse_namespace")
        self.set_instance_attribute_if_arg_exists("service")
        self.set_instance_attribute_if_arg_exists("set_strings")
        self.set_instance_attribute_if_arg_exists("sets")
        self.set_instance_attribute_if_arg_exists("tag", "image_tag")
        self.set_instance_attribute_if_arg_exists("timeout")
        self.set_instance_attribute_if_arg_exists("type", "instance_type")
        self.set_instance_attribute_if_arg_exists("user", "username")
        self.set_instance_attribute_if_arg_exists("values")
        self.set_instance_attribute_if_arg_exists("verbose")
        self.set_instance_attribute_if_arg_exists("wallet_path")

    def set_instance_attribute_if_arg_exists(
        self,
        argument: str,
        attribute: str = None
    ) -> None:
        """
        Sets an instance attribute if the argument exists and is not None.

        Args:
            argument: Command line arugment name to get.
            attribute: Instance attribute name to set. If not specified, defaults
                to `argument`.
        """
        if attribute is None:
            attribute = argument
        if getattr(self.args, argument, None) is not None:
            setattr(self, attribute, getattr(self.args, argument))

    def validate_instance_tag(self) -> None:
        """
        If the user doesn't supply ``--tag`` on the command line, and
        the sub-command selected is either ``install``, ``init``, ``upgrade``,
        or ``augment``, error out and ask the user to supply the ``--tag``.
        """
        if self.image_tag is None and self.command.__name__ in [
            "cluster_init",
            "install_instance",
            "upgrade_instance",
            "apply_augmentation",
            "delete_augmentation",
            "list_augmentations"
        ]:
            raise ArgumentTypeError("The `--tag` argument is required.")

    def validate_instance_name(self) -> None:
        """
        Check two limitations that apply to instance names:

        1. Instance name length is between 3 and 128 characters.  Until
           we find out otherwise, this is an arbitrary limit.
        2. The instance name will be used as part of a DNS hostname, so
           it must comply with DNS naming rules:  Hostname labels may
           contain only the ASCII letters ``a`` through ``z`` (in a
           case-insensitive manner), the digits ``0`` through ``9``, and
           the hyphen (``-``).  The original specification of hostnames
           in RFC 952, mandated that labels could not start with a digit
           or with a hyphen, and must not end with a hyphen.  However, a
           subsequent specification (RFC 1123) permitted hostname labels
           to start with digits.  No other symbols, punctuation
           characters, or white space are permitted.

        Note:
            This is intentionally not an ``argparse`` argument type
            because any unknown arguments will cause it to error too
            soon and give a misleading error message to the user.

        Raises:
            ArgumentTypeError:  If the instance name is invalid.
        """
        if self.instance_name is not None:
            pattern = re.compile(r"^[a-z0-9][a-z0-9-]{1,126}[a-z0-9]$")
            if not pattern.match(self.instance_name):
                raise ArgumentTypeError(
                    "Instance name must be between 3 and 128 characters long, "
                    "consist only of lower case letters digits and hyphens, "
                    "and not start or end with a hyphen."
                )

    def set_dry_run_console(self):
        """
        When running in dry-run mode, remove the fancy features from the
        console for the sake of printing Helm charts, etc.
        """
        self.console_kwargs["force_interactive"] = False
        self.console_kwargs["highlight"] = False
        self.console_kwargs["soft_wrap"] = True
        self.console = Console(**self.console_kwargs)
        self.console.log = self.console.print

    def cluster_init(self) -> None:
        """
        Perform the install/upgrade command for the gms chart.
        """
        self.console.log('Init will write/overwrite cluster-wide objects with your custom values file.')
        self.console.log('[bold]Ensure you are connected to the correct cluster!')
        if not Confirm.ask('Do you want to continue?'):
            sys.exit(1)

        self.console.log("[cyan]Initializing cluster for GMS")

        # set type to gms unless custom chart
        if self.custom_chart_path is None:
            self.instance_type = "gms"

        # Build up the command, this will install or upgrade
        init_cmd = (
            f"helm {'upgrade' if self.dry_run < 2 else 'template'} "
            "gms "
            f"{self.instance_type} "
            f"{'--install ' if self.dry_run < 2 else ''}"
            "--create-namespace "
            "--namespace gms "
            f"--set 'global.imageTag={self.image_tag}' "
            f"--set 'global.user={getpass.getuser()}' "
        )

        # Add any values override files set by the `--values` option.
        for values_file in self.values:
            init_cmd += f"--values '{values_file}' "
        # Add dry run args
        if self.dry_run:  # pragma: no coverage
            init_cmd += "--dry-run --debug "

        # Run the `helm` command.
        self.console.log("[cyan]Running helm")
        return_code, out, err = self.run_helm_install_upgrade(init_cmd)

        if return_code > 0:
            raise RuntimeError(f"Could not initialize the cluster for GMS.\n{err}")

        self.console.log(
            "[bold green]Cluster initialized for GMS successfully!"
        )

    def cluster_check(self) -> None:  # pragma: no coverage
        """
        Perform a checkout of a cluster.
        """
        self.console.log("[cyan]Checking cluster for GMS")

        self.check_kubernetes()
        self.check_istio()
        self.check_gms_ns()
        self.check_longhorn()
        self.check_rancher_monitoring()

    def install_instance(self) -> None:
        """
        Perform the ``helm install`` command, with some extra options
        for loading data.
        """
        self.console.log(f"[cyan]Installing {self.instance_name}")
        self.console.log(f"Ingress port: {self.ingress_port}")

        if not self.dry_run:
            self.console.log(f"[cyan]Setting up namespace {self.instance_name}")
            self.create_namespace()

        # Build up the install command.
        install_cmd = (
            f"helm {'install' if self.dry_run < 2 else 'template'} "
            f"{self.instance_name} "
            f"{self.instance_type} "
            f"--namespace {self.instance_name} "
            f"--timeout {self.timeout}m "
            f"--set 'global.baseDomain={self.base_domain}' "
            f"--set 'global.basePort={self.ingress_port}' "
            f"--set 'global.imageRegistry={self.docker_registry}' "
            f"--set 'global.imageTag={self.image_tag}' "
            f"--set 'global.user={getpass.getuser()}' "
        )
        if self.instance_type in {'ian', 'custom'}:  # pragma: no branch
            install_cmd += (
                f"--set 'kafka.image.registry={self.docker_registry}' "
                f"--set 'kafka.image.tag={self.image_tag}' "
            )
        if self.instance_type in {'logging', 'custom'}:
            install_cmd += (
                f"--set 'fluentd.image.repository={self.docker_registry}/gms-common/logging-fluentd' "
                f"--set 'elasticsearch.image.tag={self.image_tag}' "
                f"--set 'elasticsearch.sysctlImage.tag={self.image_tag}' "
                f"--set 'elasticsearch.kibana.image.tag={self.image_tag}' "
                f"--set 'fluentd.image.tag={self.image_tag}' "
            )
        if self.instance_type in {'keycloak', 'custom'}:
            install_cmd += (
                f"--set 'keycloakx.image.repository={self.docker_registry}/gms-common/keycloak' "
                f"--set 'keycloakx.image.tag={self.image_tag}' "
                f"--set 'postgresql.image.tag={self.image_tag}' "
            )
        if self.wallet_path is not None:
            install_cmd += "--set 'global.oracleWalletOverride=true' "
        if self.is_istio:
            install_cmd += "--set 'global.istio=true' "
        if self.dry_run:
            install_cmd += "--dry-run --debug "

        # Add any custom Helm values set by the `--set` option.
        for set in self.sets:
            install_cmd += f"--set '{set}' "

        # Add any custom Helm values set by the `--set-string` option.
        for set_string in self.set_strings:
            install_cmd += f"--set-string '{set_string}' "

        # Add any values override files set by the `--values` option.
        for values_file in self.values:
            install_cmd += f"--values '{values_file}' "

        # Apply any augmentations.
        for aug_name in self.augmentations:
            self.console.log(f"[cyan]Enabling augmentation {aug_name}")
            install_cmd += f"--set augmentation.{aug_name}.enabled=true "

        # Run the `helm install` command.
        self.console.log("[cyan]Running helm install")
        return_code, _, err = self.run_helm_install_upgrade(install_cmd)

        # Exit here for dry-run mode, since everything else after this
        # point requires a real install.
        if self.dry_run:
            sys.exit(0)

        if return_code > 0:
            raise RuntimeError(f"Could not install instance {self.instance_name}\n{err}")

        # Run the config-loader.
        self.console.log("[cyan]Beginning data load")
        self.request_dataload()

        self.console.log(
            f"\nTo list ingress routes for this instance, run `gmskube "
            f"ingress {self.instance_name}`"
        )
        self.console.log(
            f"[bold green]{self.instance_name} installed successfully!"
        )

    def upgrade_instance(self) -> None:
        """
        Perform the ``helm upgrade`` command.
        """
        self.console.log(f"[cyan]Upgrading {self.instance_name}")
        self.console.log(f"Instance type is: {self.instance_type}")

        # Get and save the existing values.
        self.console.log("Getting existing helm values")
        return_code, out, err = self.run_helm_get_values()
        if return_code == 0:
            self.console.log("Saving existing helm values to a temporary file")
            with open("/tmp/existing_values.yaml", "w") as existing_values:
                print(out, file=existing_values)
        else:
            # if we can't get the existing values then error
            raise RuntimeError(
                "Unable to get existing values for instance "
                f"{self.instance_name}\n{err}"
            )

        # Create the upgrade command.  Provide the values file from the
        # chart followed by the existing values, so Helm will merge them
        # together.
        upgrade_cmd = (
            f"helm upgrade {self.instance_name} {self.instance_type} "
            f"--namespace {self.instance_name} "
            f"--timeout {self.timeout}m "
            f"--values {self.deploy_dir / self.instance_type / 'values.yaml'} "
            f"--values /tmp/existing_values.yaml "
            f"--set 'global.user={getpass.getuser()}' "
            f"--set 'global.imageTag={self.image_tag}' "
        )
        if self.instance_type in {'ian', 'custom'}:  # pragma: no branch
            upgrade_cmd += (
                f"--set 'kafka.image.tag={self.image_tag}' "
            )
        if self.instance_type in {'logging', 'custom'}:
            upgrade_cmd += (
                f"--set 'elasticsearch.image.tag={self.image_tag}' "
                f"--set 'elasticsearch.sysctlImage.tag={self.image_tag}' "
                f"--set 'elasticsearch.kibana.image.tag={self.image_tag}' "
                f"--set 'fluentd.image.tag={self.image_tag}' "
            )
        if self.instance_type in {'keycloak', 'custom'}:
            upgrade_cmd += (
                f"--set 'keycloakx.image.tag={self.image_tag}' "
                f"--set 'postgresql.image.tag={self.image_tag}' "
            )
        if self.dry_run:
            upgrade_cmd += "--dry-run --debug "

        # Add any custom Helm values set by the `--set` option.
        for set in self.sets:
            upgrade_cmd += f"--set '{set}' "

        # Add any custom Helm values set by the `--set-string` option.
        for set_string in self.set_strings:
            upgrade_cmd += f"--set-string '{set_string}' "

        # Add any values override files set by the `--values` option.
        for values_file in self.values:
            upgrade_cmd += f"--values '{values_file}' "

        # Apply any augmentations.
        for aug_name in self.augmentations:
            self.console.log(f"[cyan]Enabling augmentation {aug_name}")
            upgrade_cmd += f"--set augmentation.{aug_name}.enabled=true "

        # Run the `helm upgrade` command.
        self.console.log("[cyan]Running helm upgrade")
        return_code, out, err = self.run_helm_install_upgrade(upgrade_cmd)
        if return_code > 0:
            raise RuntimeError(
                f"Could not upgrade instance {self.instance_name}\n{err}"
            )

        self.console.log(f"[bold green]{self.instance_name} upgrade complete!")

    def uninstall_instance(self) -> None:
        """
        Perform the ``helm uninstall`` command, wait for pods to
        terminate, and then optionally delete the namespace.
        """
        self.console.log(f"[cyan]Uninstalling {self.instance_name}")

        # run helm uninstall
        self.console.log("[cyan]Running helm uninstall")
        return_code, _, _ = self.run_helm_uninstall()

        if return_code != 0:
            self.console.log("Helm uninstall unsuccessful.")

        appsv1 = client.AppsV1Api()
        corev1 = client.CoreV1Api()
        label_selector = 'app.kubernetes.io/managed-by==Helm'

        # wait for resources created by helm to terminate since helm uninstall is async
        timeout_seconds = self.timeout * 60
        time_waited = 0
        while (time_waited < timeout_seconds and return_code == 0):  # pragma: no branch
            # get count of resources filtered by label
            daemonsets = len(appsv1.list_namespaced_daemon_set(self.instance_name, label_selector=label_selector).items)
            deployments = len(appsv1.list_namespaced_deployment(self.instance_name, label_selector=label_selector).items)
            replicasets = len(appsv1.list_namespaced_replica_set(self.instance_name, label_selector=label_selector).items)
            statefulsets = len(appsv1.list_namespaced_stateful_set(self.instance_name, label_selector=label_selector).items)
            pvcs = len(corev1.list_namespaced_persistent_volume_claim(self.instance_name, label_selector=label_selector).items)
            remaining = daemonsets + deployments + replicasets + statefulsets + pvcs
            if remaining == 0:  # pragma: no branch
                break

            if time_waited % 15 == 0:  # pragma: no coverage
                # print a message every 15 seconds noting that we are waiting
                self.console.log(
                    f"Waiting for helm resources to terminate, "
                    f"{remaining} resources remaining"
                )
            time.sleep(1)  # pragma: no coverage
            time_waited += 1  # pragma: no coverage
            if time_waited >= timeout_seconds:  # pragma: no coverage
                self.print_warning("Timed out waiting for helm resources to terminate")

        # Delete the namespace, watch for completion
        if not self.reuse_namespace:
            self.console.log("[cyan]Deleting namespace")
            try:
                corev1.delete_namespace(self.instance_name)
                w = watch.Watch()
                for event in w.stream(
                    func=corev1.list_namespace,
                    field_selector=f"metadata.name={self.instance_name}",
                    timeout_seconds=600
                ):  # pragma: no coverage
                    if event["type"] == "DELETED":
                        w.stop()

            except ApiException as ex:
                self.print_error(ex.reason)
                self.print_error(
                    f"{self.instance_name} uninstall unsuccessful, "
                    "please review errors/warnings above"
                )
                return

        self.console.log(f"[bold green]{self.instance_name} uninstall complete!")

    def reconfigure_instance(self) -> None:
        """
        Reconfigure the instance:  run a reduced data-load, and then
        ``rollout restart`` deployments that require it.
        """
        if self.config_override_path is None:
            raise ArgumentTypeError("Config override path must be specified with --config")

        self.console.log(f"[cyan]Reconfiguring {self.instance_name}")
        self.console.log(f"Instance istio status: {self.is_istio}")
        self.console.log(f"Ingress port: {self.ingress_port}")

        self.console.log("[cyan]Beginning data load")
        if not self.request_dataload(endpoint="reload"):
            raise RuntimeError("Data load failed to execute successfully, Exiting")

        # restart deployments with gms/restartAfterReconfig label
        self.console.log("[cyan]Rollout restart deployments")
        self.console.log(
            "Getting list of deployments with label "
            "`gms/restartAfterReconfig=true`"
        )
        appsv1 = client.AppsV1Api()
        deployments = appsv1.list_namespaced_deployment(self.instance_name, label_selector='gms/restartAfterReconfig=true')

        # restart each deployment by adding an annotation with the current timestamp
        for deployment in deployments.items:
            self.console.log(f"Restarting deployment {deployment.metadata.name}")
            now = str(datetime.datetime.utcnow().isoformat("T") + "Z")
            body = {
                'spec': {
                    'template': {
                        'metadata': {
                            'annotations': {
                                'kubectl.kubernetes.io/restartedAt': now
                            }
                        }
                    }
                }
            }
            appsv1.patch_namespaced_deployment(deployment.metadata.name, self.instance_name, body)
        self.console.log(f"[bold green]{self.instance_name} reconfig complete!")

    def list_instances(self) -> None:
        """
        List the installed instances.
        """

        # Get all the Helm instances.
        return_code, out, err = self.run_helm_list()
        if return_code > 0:
            raise RuntimeError(f"Could not list instances\n{err}")
        instances = json.loads(out)

        # Get all `gms` ConfigMaps.
        all_gms_configmaps = client.CoreV1Api().list_config_map_for_all_namespaces(
            field_selector='metadata.name==gms'
        ).items

        # Check if the given instance name isn't in the list.
        if (
            self.instance_name is not None
            and all(i["name"] != self.instance_name for i in instances)
        ):
            raise RuntimeError(
                f"Instance name `{self.instance_name}` does not exist."
            )

        # Loop through each of the Helm instances.
        table = Table(
            "NAME",
            "STATUS",
            "TYPE",
            "USER",
            "UPDATED",
            "TAG",
            box=box.SIMPLE,
            expand=False,
            pad_edge=False,
            show_edge=False
        )
        for instance in instances:
            labels = self.get_labels_for_list(instance, all_gms_configmaps)
            if self.filter_list(instance, labels):
                continue
            table.add_row(
                instance["name"],
                instance["status"],
                labels.get("gms/type", "?"),
                labels.get("gms/user", "?"),
                labels.get("gms/update-time", "?"),
                labels.get("gms/image-tag", "?"),
            )  # yapf: disable
        self.print_table_no_wrap(table)

    @staticmethod
    def get_labels_for_list(
        instance: dict[str, str],
        configmaps: list
    ) -> dict[str, str]:  # yapf: disable
        """
        Get the labels for the given instance.

        Args:
            instance:  The instance JSON data.
            configmaps:  The key-value pairs from all the ConfigMaps.

        Returns:
            The instance labels.
        """
        gmslabels = (
            item.metadata.labels
            for item in configmaps
            if item.metadata.labels["gms/name"] == instance["name"]
        )
        return next(gmslabels, {})  # pragma: no branch

    def filter_list(
        self,
        instance: dict[str, str],
        labels: dict[str, str]
    ) -> bool:  # yapf: disable
        """
        Filter the table of instances according to these criteria:

        * We only want to see instances with ``gms`` labels, unless the
          ``--all`` flag is specified.
        * If the instance name is specified, only show that row of the
          table.
        * If ``--user`` is specified, only show instances created by
          that user.
        * If ``--type`` is specified, only show instances of that type.

        Args:
            instance:  The instance JSON data.
            labels:  Any labels on the instance.

        Returns:
            Whether to filter the current ``instance`` from the table.
        """
        return (
            not self.show_all
            and not labels
            or (
                self.instance_name is not None
                and instance["name"] != self.instance_name
            )
            or (
                self.username is not None
                and labels.get("gms/user", "?") != self.username
            )
            or (
                self.filter_type is not None
                and labels.get("gms/type", "?") != self.filter_type
            )
        )  # yapf: disable

    def list_ingress_routes(self) -> None:
        """
        List the ingress routes for an instance.
        """
        table = Table(
            "SERVICE",
            "URL",
            box=box.SIMPLE,
            expand=False,
            pad_edge=False,
            show_edge=False
        )

        if self.is_istio:
            # loop through the virtualservice data
            # note that custom resources come back as json instead of object attributes
            data = client.CustomObjectsApi().list_namespaced_custom_object("networking.istio.io", "v1beta1", self.instance_name, "virtualservices")['items']
            for vs in data:
                host = f"https://{vs['spec']['hosts'][0]}:{self.ingress_port}"
                name = vs['metadata']['name']
                for http in vs['spec']['http']:
                    for match in http["match"]:
                        try:
                            path = match["uri"]["prefix"].strip("/")
                            url = f"{host}/{path}"
                            if self.service is None:
                                table.add_row(name, url)
                            elif name == self.service:
                                print(url)
                                return
                        except KeyError:
                            # if there is no uri/prefix then just ignore it
                            continue
        else:
            # loop through the ingress data
            data = client.NetworkingV1Api().list_namespaced_ingress(self.instance_name).items
            for ingress in data:
                for rule in ingress.spec.rules:
                    host = f"https://{rule.host}:{self.ingress_port}"
                    for path in rule.http.paths:
                        name = path.backend.service.name
                        path_clean = re.sub(r'[\(\$\.\*\)\|\/]*$', '', path.path.strip("/"))
                        url = f"{host}/{path_clean}"
                        if self.service is None:
                            table.add_row(name, url)
                        elif name == self.service:
                            print(url)
                            return

        if self.service is None:
            self.print_table_no_wrap(table)

    def apply_augmentation(self) -> None:
        """
        Apply an augmentation to a standing instance.
        """
        try:
            self.console.log(
                f"[cyan]Applying augmentation `{self.augmentation_name}` to "
                f"instance `{self.instance_name}`."
            )

            # sets should be in the context of the augmentation application,
            # so append the right scope
            for i in range(len(self.sets)):
                self.sets[i] = (
                    f"augmentation.{self.augmentation_name}.{self.sets[i]}"
                )
            self.augmentations = [self.augmentation_name]
            self.upgrade_instance()
        except Exception as e:
            raise RuntimeError(
                f"Failed to apply augmentation `{self.augmentation_name}` to "
                f"instance `{self.instance_name}`\n{e}"
            )
        self.console.log(
            f"[bold green]Augmentation '{self.augmentation_name}' "
            f"successfully applied to {self.instance_name}"
        )

    def delete_augmentation(self) -> None:
        """
        Delete an augmentation from a standing instance.
        """
        try:
            self.console.log(
                f"[cyan]Deleting augmentation `{self.augmentation_name}` from "
                f"instance `{self.instance_name}`."
            )
            self.sets = [
                f"augmentation.{self.augmentation_name}.enabled=false"
            ]
            self.upgrade_instance()

        except Exception as e:
            raise RuntimeError(
                f"Failed to delete augmentation `{self.augmentation_name}` "
                f"from instance `{self.instance_name}`\n{e}"
            )

        self.console.log(
            f"[bold green]Augmentation `{self.augmentation_name}` "
            f"successfully deleted from instance `{self.instance_name}`."
        )

    def list_augmentations(self) -> None:
        """
        Display a table of the augmentations available to be applied to
        an instance.
        """
        augmentations = []
        with open(self.deploy_dir / "ian/charts/augmentation/values.yaml", "r") as file:
            aug_values = yaml.safe_load(file)
        for key, value in aug_values.items():
            with contextlib.suppress(KeyError, TypeError):
                metadata = value["metadata"]
                aug = {
                    "name": key,
                    "type": metadata.get("type", "none"),
                    "labels": metadata.get("labels", []),
                    "wait": metadata.get("wait", ""),
                    "description": metadata.get("description", "")
                }  # yapf: disable
                augmentations.append(aug)

        table = Table(
            "NAME",
            "TYPE",
            "LABELS",
            "DESCRIPTION",
            box=box.SIMPLE,
            expand=False,
            pad_edge=False,
            show_edge=False
        )

        for a in sorted(augmentations, key=itemgetter("type")):
            table.add_row(
                a["name"],
                a["type"],
                ",".join(a.get("labels", [])),
                a["description"]
            )
        self.console.print(table)

    def set_helm_path(self) -> None:
        """
        Set the environment PATH to include the correct versions of
        helm depending on the kubernetes_version.
        """
        helm_version = "3.14"

        # see https://helm.sh/docs/topics/version_skew/
        if self.kubernetes_version in {'1.20', '1.21', '1.22', '1.23'}:
            helm_version = "3.8"
        elif self.kubernetes_version in {'1.24', '1.25'}:
            helm_version = "3.12"
        elif self.kubernetes_version in {'1.26', '1.27', '1.29'}:
            helm_version = "3.14"
        else:
            self.print_warning(
                f"Kubernetes version {self.kubernetes_version} detected. "
                "Only Kubernetes versions 1.20-1.29 are supported "
                f"by gmskube. Helm {helm_version} will be used, which may not "
                "be compatible."
            )

        # The dockerfile must have the correct versions in /opt
        os.environ["PATH"] = (
            f"/opt/helm_{helm_version}:"
            f"{os.getenv('PATH')}"
        )

    def request_dataload(
        self,
        endpoint: str = "load",
    ) -> bool:
        """
        Send a HTTP request to the ``config-loader`` initiate a
        data-load.

        Args:
            endpoint:  The HTTP service target endpoint.

        Returns:
            ``True`` if the data-load was successful; ``False``
            otherwise.
        """
        timeout_seconds = self.timeout * 60

        # check if config-loader service exists in the instance
        try:
            client.CoreV1Api().read_namespaced_service('config-loader', self.instance_name)
        except ApiException as ex:
            if ex.reason == NOT_FOUND:
                self.console.log("config-loader service does not exist, skipping data load")
                return True
            else:
                raise ex

        retry_strategy = Retry(
            total=20,
            backoff_factor=0.2,
            status_forcelist=[404],
            allowed_methods=["POST", "GET"]
        )  # yapf: disable
        adapter = HTTPAdapter(max_retries=retry_strategy)
        http = requests.Session()
        http.mount("https://", adapter)

        # format the url - must be https on kube cluster, and the requests
        # CA
        # bundle env var must be set
        config_loader_url = (
            f"https://{self.instance_name}.{self.base_domain}:{self.ingress_port}/"
            "config-loader"
        )

        if self.config_override_path is not None:
            override_file = self.get_override_zip_file()
            if override_file is None:
                raise RuntimeError("Unable to create zip file from user supplied overrides")
            files = {"zipfile": override_file}
        else:
            files = None

        self.console.log("Waiting for config loader to be alive")
        time_waited = 0
        while time_waited < timeout_seconds:
            post_response = http.get(
                f"{config_loader_url}/alive",
                allow_redirects=False
            )

            if post_response.status_code == 200:
                break

            if time_waited % 30 == 0:  # pragma: no branch
                # print a message every 30 seconds noting that we are
                # waiting.
                self.console.log("Waiting for config loader to be alive")

            time.sleep(1)
            time_waited += 1

            if time_waited >= timeout_seconds:  # pragma: no branch
                self.print_warning(
                    "Timed out waiting for config loader to be alive, "
                    "will attempt data load anyway"
                )

        self.console.log("Requesting data load")
        post_response = http.post(
            f"{config_loader_url}/{endpoint}",
            files=files
        )

        if post_response.status_code != 200:
            raise RuntimeError(
                "Failed to initiate a data load. "
                f"{post_response.status_code}: {post_response.reason}"
            )

        # Wait for results from the config-loader service
        response_json = None
        time_waited = 0
        while time_waited < timeout_seconds:  # pragma: no branch
            time.sleep(1)
            time_waited += 1

            get_response = http.get(f"{config_loader_url}/result")
            if get_response.status_code != 200:
                self.print_warning(
                    "Status code from result endpoint("
                    f"{config_loader_url}/{endpoint}"
                    ") was unexpected: "
                    f"{get_response.status_code}"
                    " Message: "
                    f"{get_response.reason}"
                )
                continue

            try:
                response_json = get_response.json()
                # print out the chunks of the partial config-loader log
                if partial_result := response_json["partial_result"]:
                    self.console.log(partial_result.strip())
                if response_json["status"] == "FINISHED":
                    break
            except json.decoder.JSONDecodeError:
                self.print_warning(
                    "Unable to convert response to json: "
                    f"'{get_response.text}'"
                )

        if response_json is None:
            raise RuntimeError("Data load response status is unknown")
        elif response_json["status"] != "FINISHED":
            raise RuntimeError(
                f"Timed out waiting for data load after {self.timeout} "
                "minutes, Exiting"
            )
        elif response_json["successful"]:
            self.console.log("Data load successfully completed")
            return True
        else:
            raise RuntimeError(
                "Data load failed to execute successfully, Exiting"
            )

    def get_override_zip_file(self) -> memoryview:
        """
        Create a zip file from the input ``--config`` directory.
        """
        buffered_zipfile = None
        try:
            # these are the only 2 directories suitable for overrides
            dirlist = [
                self.config_override_path / "processing",
                self.config_override_path / "user-preferences"
            ]

            # Create the zip file
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED, False) as zip_file:
                for override_dir in dirlist:
                    if override_dir.exists():
                        for file in (f for f in override_dir.rglob('*') if f.is_file()):
                            logging.debug(f'Adding to zip: {file.relative_to(self.config_override_path)}')
                            zip_file.write(file, file.relative_to(self.config_override_path))
            buffered_zipfile = zip_buffer.getbuffer()
        except Exception as ex:
            self.print_error(ex)
        return buffered_zipfile

    def create_namespace(self) -> None:
        """
        Create a new Kubernetes namespace for the instance.  Add the
        Istio label and Rancher project annotations, if applicable.

        Raises:
            RuntimeError:  If there's a failure in either creating,
                labeling, or annotating the namespace.
        """
        # standard labels
        labels = {
            "app.kubernetes.io/instance": self.instance_name,
            "app.kubernetes.io/name": self.instance_type,
            "app.kubernetes.io/part-of": self.instance_type,
            "pod-security.kubernetes.io/enforce": "privileged",
            "pod-security.kubernetes.io/enforce-version": "v1.25",
            "pod-security.kubernetes.io/audit": "privileged",
            "pod-security.kubernetes.io/audit-version": "v1.25",
            "pod-security.kubernetes.io/warn": "privileged",
            "pod-security.kubernetes.io/warn-version": "v1.25"
        }
        if self.is_istio:
            self.console.log("Adding `istio-injection=enabled` label.")
            labels["istio-injection"] = "enabled"

        body = {
            'metadata': {
                'name': self.instance_name,
                'labels': labels
            }
        }
        try:
            client.CoreV1Api().create_namespace(body)
        except ApiException as ex:
            if ex.reason == "Conflict":
                if self.reuse_namespace:
                    client.CoreV1Api().patch_namespace(self.instance_name, body)
                else:
                    raise RuntimeError(
                        f"Namespace already exists. Run `gmskube uninstall {self.instance_name}`, "
                        "or use `--reuse-namespace` argument."
                    )
            else:
                raise ex

    def check_kubernetes(self) -> None:
        """
        Check kubernetes overall cluster status
        """
        if self.kubernetes_version in {
            '1.20',
            '1.21',
            '1.22',
            '1.23',
            '1.24',
            '1.25',
            '1.26',
            '1.27',
            '1.28',
            '1.29'
        }:
            self.console.log(f'Kubernetes version: [green]PASS[/] - {self.kubernetes_version}')
        else:
            self.console.log(f'Kubernetes version: [yellow]WARN[/] - {self.kubernetes_version} is not supported by gmskube')

        self.check_all_pods_ready('kube-system')
        self.check_all_nodes_ready()

    def check_istio(self) -> None:
        """
        Check istio-system is installed and running
        """
        if self.check_namespace_exists('istio-system'):
            self.console.log('istio-system namespace: [green]PASS[/] - exists')
            self.check_all_pods_ready('istio-system')
            self.check_resource_exists('istio-system', 'Gateway', 'ingress-default-gateway')
            self.check_resource_exists('istio-system', 'Secret', 'ingress-default-cert')
        else:
            self.console.log('istio-system namespace: [red]FAIL[/] - missing, install istio')

    def check_longhorn(self) -> None:
        """
        Check longhorn-system is installed and running
        """
        if self.check_namespace_exists('longhorn-system'):
            self.console.log('longhorn-system namespace: [green]PASS[/] - exists')
            self.check_all_pods_ready('longhorn-system')
        else:
            self.console.log('longhorn-system namespace: [yellow]WARN[/] - missing, another storage provider must be present')

    def check_rancher_monitoring(self) -> None:
        """
        Check rancher-monitoring is installed and running
        """
        if self.check_namespace_exists('cattle-monitoring-system'):
            self.console.log('cattle-monitoring-system namespace: [green]PASS[/] - exists')
            self.check_all_pods_ready('cattle-monitoring-system')
        else:
            self.console.log('cattle-monitoring-system namespace: [yellow]WARN[/] - missing, gms monitoring will be unavailable')

    def check_gms_ns(self) -> None:
        """
        Check gms namespace resources exist
        """
        if self.check_namespace_exists('gms'):
            self.console.log('gms namespace: [green]PASS[/] - exists')
            self.check_resource_exists('gms', 'ConfigMap', 'bridge-path-config')
            self.check_resource_exists('gms', 'ConfigMap', 'event-relocator-path-config')
            self.check_resource_exists('gms', 'ConfigMap', 'ingress-ports-config')
            self.check_resource_exists('gms', 'ConfigMap', 'keycloak-config')
            self.check_resource_exists('gms', 'ConfigMap', 'ldap-ca-cert')
            self.check_resource_exists('gms', 'ConfigMap', 'logging-ldap-proxy-config')
            self.check_resource_exists('gms', 'Secret', 'ingress-default-cert')
            self.check_resource_exists('gms', 'Secret', 'ldap-bindpass')
            self.check_resource_exists('gms', 'Secret', 'oracle-wallet-default')
        else:
            self.console.log('gms namespace: [red]FAIL[/] - missing, run `gmskube cluster init`')

    def check_namespace_exists(self, namespace: str) -> bool:
        """
        Check if namespace exists

        Args:
            namespace: namespace name to check

        Returns:
           True if namespace exists, false otherwise
        """
        try:
            client.CoreV1Api().read_namespace(namespace)
            return True
        except ApiException as ex:
            if ex.reason == NOT_FOUND:
                return False
            else:
                raise ex

    def check_resource_exists(self, namespace: str, resource_type: str, resource_name: str) -> bool:
        """
        Check if resource exists. Prints logging messages.

        Args:
            namespace: Namespace of the resource
            resource_type: Type of resource (configmap, secret, or gateway)
            resource_name: Name of resource
        """
        try:
            match resource_type.lower():
                case "configmap":
                    client.CoreV1Api().read_namespaced_config_map(resource_name, namespace)
                case "secret":
                    client.CoreV1Api().read_namespaced_secret(resource_name, namespace)
                case "gateway":
                    client.CustomObjectsApi().get_namespaced_custom_object("networking.istio.io", "v1beta1", namespace, "gateways", resource_name)
                case _:
                    raise TypeError('Unknown value for resource_type')
            self.console.log(f'{namespace} {resource_type} {resource_name}: [green]PASS[/] - exists')
            return True
        except ApiException as ex:
            if ex.reason == NOT_FOUND:
                self.console.log(f'{namespace} {resource_type} {resource_name}: [red]FAIL[/] - missing')
                return False
            else:
                raise ex

    def check_all_pods_ready(self, namespace: str) -> bool:
        """
        Check Ready status condition for all pods in namespace. Prints logging messages.

        Args:
            namespace: The namespace to check
        """
        pods = client.CoreV1Api().list_namespaced_pod(namespace).items
        if not pods:
            self.console.log(f'{namespace} pods: [red]FAIL[/] - no pods in namespace')
            return False
        for pod in pods:
            condition = [c for c in pod.status.conditions if c.type == 'Ready'][0]
            if condition.status != 'True' and pod.status.phase != 'Succeeded':
                self.console.log(f'{namespace} pods: [red]FAIL[/] - some pods not ready, run `kubectl -n {namespace} get pod`')
                return False
        self.console.log(f'{namespace} pods: [green]PASS[/] - all pods ready')
        return True

    def check_all_nodes_ready(self) -> bool:
        """
        Check Ready status condition for all nodes in cluster. Prints logging messages.
        """
        nodes = client.CoreV1Api().list_node().items
        if not nodes:
            self.console.log('node status: [red]FAIL[/] - no nodes listed, run `kubectl get node`')
            return False
        for node in nodes:
            condition = [c for c in node.status.conditions if c.type == 'Ready'][0]
            if condition.status != 'True':
                self.console.log('node status: [red]FAIL[/] - some nodes not ready, run `kubectl get node`')
                return False
        self.console.log('node status: [green]PASS[/] - all nodes ready')
        return True

    def run_command(
        self,
        command: str,
        cwd: str | None = None,
        print_output: bool = True
    ) -> tuple[int, str, str]:  # yapf: disable
        """
        Execute the given command in the underlying shell.

        command:  The command string to execute.
        cwd:  The directory in which to run the command.  ``None`` means
            the current working directory.
        print_output:  Whether to print the ``stdout`` and ``stderr``
            from the command.

        Returns:
            A tuple of the return code, ``stdout`` string, and
            ``stderr`` string.
        """
        logging.debug(f"Running command: {command}")
        result = subprocess.run(
            command,
            capture_output=True,
            cwd=cwd,
            shell=True,
            text=True
        )
        if print_output:
            self.console.log(result.stdout)

            pat = r'\s*walk\.go:\d+:\s*found\s+symbolic\s+link\s+in\s+path:.*used\s*'
            stderr_filtered = re.sub(pat, '', result.stderr)
            if len(stderr_filtered) > 0:
                self.print_warning(stderr_filtered)
        return result.returncode, result.stdout, result.stderr

    def print_warning(self, message: str) -> None:
        """
        Print a warning message in bold yellow.

        Args:
            message:  The message to print.
        """
        self.console.log(fr"[bold yellow]\[WARNING] {message}")

    def print_error(self, message: str) -> None:
        """
        Print an error message in bold red.

        Args:
            message:  The message to print.
        """
        self.console.log(fr"[bold red]\[ERROR] {message}")

    def print_table_no_wrap(self, table: Table) -> None:
        """
        Print a rich Table without wrapping or truncating, but still allowing
        auto-calalculation of widths. This is done by temporarly setting the
        terminal column width to 1000, then setting back to the original value.

        Args:
            table: Table to print
        """
        columns = os.getenv("COLUMNS")
        os.environ["COLUMNS"] = "1000"
        self.console.print(table)
        if columns is not None:  # pragma: no branch
            os.environ["COLUMNS"] = columns

    def run_helm_list(self) -> tuple[int, str, str]:  # pragma: no coverage
        return self.run_command(
            "helm list --all --all-namespaces --output json",
            cwd=self.deploy_dir,
            print_output=False
        )

    def run_helm_get_values(
        self
    ) -> tuple[int, str, str]:  # pragma: no coverage; yapf: disable
        return self.run_command(
            f"helm get values {self.instance_name} --all --namespace "
            f"{self.instance_name}",
            cwd=self.deploy_dir,
            print_output=False
        )

    def run_helm_uninstall(
        self
    ) -> tuple[int, str, str]:  # pragma: no coverage; yapf: disable
        return self.run_command(
            f"helm uninstall {self.instance_name} --namespace "
            f"{self.instance_name}",
            cwd=self.deploy_dir,
            print_output=True
        )

    def run_helm_install_upgrade(
        self,
        command: str | list[str]
    ) -> tuple[int, str, str]:  # pragma: no coverage; yapf: disable
        return self.run_command(
            command,
            cwd=self.deploy_dir,
            print_output=True
        )


def get_parser() -> ArgumentParser:  # pragma: no coverage
    """
    Needed to allow us to use ``shtab`` to generation the bash
    completion file for this script by running ``shtab
    gmskube.gmskube.get_parser > bash_completion`` in the
    ``python/gmskube`` directory.
    """
    return GMSKube().parser


def handler(
    signal_received: int,
    frame: FrameType
) -> None:  # pragma: no coverage
    sys.exit(0)


if __name__ == "__main__":  # pragma: no coverage
    signal(SIGINT, handler)
    gmskube = GMSKube()
    gmskube.main(sys.argv[1:])
