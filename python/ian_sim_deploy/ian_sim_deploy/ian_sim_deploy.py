#!/usr/bin/env python3
import re
import sys
from argparse import (
    ArgumentParser,
    ArgumentTypeError,
    BooleanOptionalAction,
    SUPPRESS
)
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[3] / "python"))
from driver_script import lazy_property  # noqa: E402
from gmskube import Parsers  # noqa: E402
from gmskube_wrapper import GMSKubeWrapper  # noqa: E402
from reverse_argparse import quote_arg_if_necessary  # noqa: E402
from simulator_mixin import SimulatorMixin  # noqa: E402


class IANSimDeploy(SimulatorMixin, GMSKubeWrapper):
    """
    This class is designed to install and interact with an IAN instance
    of GMS.  It contains the following stages:

    Install
        Install an IAN instance using the simulator and containerized
        Oracle augmentations.  If the installation fails, for whatever
        reason, this stage can be retried automatically.
    Wait
        Wait for all the containers in all the pods to reach a ``READY``
        state.
    Init
        Post to the simulator's ``initialize`` endpoint and wait for it
        to reach the ``INITIALIZED`` state.
    Start
        Post to the simulator's ``start`` endpoint and wait for it to
        reach the ``STARTED`` state.
    Stop
        Post to the simulator's ``stop`` endpoint and wait for it to
        reach the ``STOPPED`` state.
    Clean
        Post to the simulator's ``cleanup`` endpoint and wait for it to
        reach the ``UNINITIALIZED`` state.
    Status
        Post to the simulator's ``status`` endpoint and display the
        current simulator state.
    Uninstall
        Uninstall the instance.

    Note:
        The **Init** through **Status** stages are provided by the
        :class:`SimulatorMixin`.

    Attributes:
        calib_update_freq (str):  The simulator's calibration update
            frequency.
        config_override_path (str):  The path to a directory of
            configuration overrides to load into the instance.
        istio (bool):  Whether to enable Istio injection.
        keycloak (bool):  Whether to enable KeyCloak authentication.
        node_env (str):  Which ``NODE_ENV`` to set for the UI.
        op_time_period (str):  The simulator's operational time period.
        seed_end_time (str):  The end time for the seed data when
            initializing the simulator.
        seed_start_time (str):  The start time for the seed data when
            initializing the simulator.
        set_strings (list[str]):  A list of ``key=value`` strings for
            setting values in the Helm charts.
        sets (list[str]):  Like ``set_strings``, but without forcing
            string values.
        sim_start_time (str):  The simulation start time.
        state_timeout (int):  How long to wait (in minutes) for the
            simulation to transition to a desired state.
        gmskube_timeout (int):  A timeout (in minutes) used for various
            ``gmskube`` operations.
        values (str):  The path to a values override YAML file.

    Note:
        Additional attributes are defined in the :class:`DriverScript`
        and :class:`GMSKubeWrapper` base classes.
    """

    def __init__(self, stages: set[str]):
        """
        Initialize an :class:`IANSimDeploy` object.

        Args:
            stages:  The set of stages to register for this instance.
                This may be a subset of all the stages defined in the
                class.
        """
        super().__init__(stages)

    def main(self, argv: list[str]) -> None:
        """
        This method handles installing an instance and initializing,
        starting, stopping, cleaning, or checking the status of the
        simulator.

        Args:
            argv:  The command line arguments used when running this
                file as a script.
        """
        self.parse_args(argv)
        try:
            if "install" in self.stages_to_run:
                self.install_instance()
            if "wait" in self.stages_to_run:
                self.wait_for_all_pods_ready()
            if "init" in self.stages_to_run:
                self.initialize_simulator()
            if "start" in self.stages_to_run:
                self.start_simulator()
            if "stop" in self.stages_to_run:
                self.stop_simulator()
            if "clean" in self.stages_to_run:
                self.clean_up_simulator()
            if "status" in self.stages_to_run:
                self.check_simulator_status()
            if "uninstall" in self.stages_to_run:
                self.uninstall_instance()
            if self.save_logs:
                self.save_container_logs()
        finally:
            self.print_script_execution_summary()

    #
    # Parse the command line arguments.
    #

    @lazy_property
    def parser(self) -> ArgumentParser:
        """
        Create an ``ArgumentParser`` that contains all the necessary
        arguments for this script.
        """
        ap = super().parser
        ap.description = (
            "This script deploys an IAN instance of GMS using the simulator "
            "and containerized Oracle augmentations.  It's composed of the "
            "following stages:\n\n"
            "* install:  Install an IAN instance.\n"
            "* wait:  Wait for all the pods to be ready.\n"
            "* init:  Initialize the simulator.\n"
            "* start:  Start the simulator.\n"
            "* stop:  Stop the simulator.\n"
            "* clean:  Clean up the simulator.\n"
            "* status:  Check the simulator status.\n"
            "* uninstall:  Uninstall the instance.\n\n"
            "Any stages called out on the command line via the ``--stage`` "
            "flag are executed in the order above."
        )
        ap.epilog = (
            "examples:\n"
            "  Here are a handful of standard use cases.\n\n"
            "  Install an instance, wait for the pods to be ready, and "
            "initialize and start the simulator::\n\n"
            "      ian_sim_deploy.py --tag <branch/tag/sha1> --instance <name>"
            "\n\n"
            "  Initialize and start the simulator for a standing instance::"
            "\n\n"
            "      ian_sim_deploy.py --instance <name> --stage init start\n\n"
            "  Check the simulator status::\n\n"
            "      ian_sim_deploy.py --instance <name> --stage status\n\n"
            "  Shut down the simulator::\n\n"
            "      ian_sim_deploy.py --instance <name> --stage stop clean\n\n"
            "  If an instance appears to be misbehaving, grab all the "
            "container logs::\n\n"
            "      ian_sim_deploy.py --instance <name> --stage status "
            "--save-logs"
        )
        ap.add_argument(
            "--keycloak",
            default=True,
            action=BooleanOptionalAction,
            help="Whether to use KeyCloak authentication."
        )
        ap.add_argument(
            "--node-env",
            default="production",
            choices={"production",
                     "development"},
            help="What Node environment to use."
        )
        ap.add_argument(
            "--state-timeout",
            default=5,
            type=int,
            help="How long to wait (in minutes) for the simulator to "
            "transition to a desired state."
        )
        install_group = ap.add_argument_group(
            "install",
            "Additional options to pass on to `gmskube install`."
        )
        Parsers.add_istio_args(install_group)
        Parsers.add_set_args(install_group)
        Parsers.add_set_string_args(install_group)
        Parsers.add_timeout_args(install_group)
        Parsers.add_values_args(install_group)
        Parsers.add_config_args(install_group)
        init_group = ap.add_argument_group(
            "init",
            "Additional options for initializing the simulator."
        )
        init_group.add_argument(
            "--seed-start-time",
            default="2019-01-05T16:00:00Z",
            type=self.datetime_type,
            help="The start time for the seed data when initializing the "
            "simulator."
        )
        init_group.add_argument(
            "--seed-end-time",
            default="2019-01-05T22:00:00Z",
            type=self.datetime_type,
            help="The end time for the seed data when initializing the "
            "simulator."
        )
        init_group.add_argument(
            "--sim-start-time",
            default=None,
            type=self.datetime_type,
            help="The simulation start time for initializing the simulator.  "
            "Must be specified in UTC in 'YYYY-MM-DDTHH:MM:SSZ' format, e.g., "
            "'2023-01-23T16:56:07Z'.  Defaults to 8 hours ago, rounded back "
            "to the top of the hour."
        )
        init_group.add_argument(
            "--op-time-period",
            default="PT24H",
            help="The simulator's operational time period."
        )
        init_group.add_argument(
            "--calib-update-freq",
            default="PT6H",
            help="The simulator's calibration update frequency."
        )
        ap.set_defaults(
            install_retry_attempts=2,
            install_retry_timeout=600,
            stage=["install", "wait", "init", "start"],
            timeout=15,
            wait_timeout=900
        )  # yapf: disable
        for stage in self.stages - {"install"}:
            for arg in ["attempts", "delay", "timeout"]:
                getattr(self, f"{stage}_retry_{arg}_arg").help = SUPPRESS
        return ap

    @staticmethod
    def datetime_type(input_string: str) -> str:
        """
        Ensure times given by the user on the command line adhere to the
        'YYYY-MM-DDTHH:MM:SSZ' format, e.g., '2019-01-05T16:00:00Z'.

        Args:
            input_string:  Whatever the user specifies.

        Raises:
            ArgumentTypeError:  If the format is invalid.

        Returns:
            The input string.
        """
        if not re.match(
            r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$",
            input_string
        ):
            raise ArgumentTypeError(
                "Times must be specified in the 'YYYY-MM-DDTHH:MM:SSZ' "
                "format, e.g., '2019-01-05T16:00:00Z'."
            )
        return input_string

    def parse_args(self, argv: list[str]) -> None:
        """
        Parse the command line arguments, and handle any special cases.

        Args:
            argv:  The command line arguments used when running this
                file as a script.
        """
        super().parse_args(argv)
        self.calib_update_freq = self.args.calib_update_freq
        self.config_override_path = getattr(self.args, "config", None)
        self.istio = self.args.istio
        self.keycloak = self.args.keycloak
        self.node_env = self.args.node_env
        self.op_time_period = self.args.op_time_period
        self.seed_end_time = self.args.seed_end_time
        self.seed_start_time = self.args.seed_start_time
        self.set_strings = getattr(self.args, "set_strings", None)
        self.sets = getattr(self.args, "sets", None)
        self.sim_start_time = self.args.sim_start_time
        self.state_timeout = self.args.state_timeout
        self.gmskube_timeout = self.args.timeout
        self.values = getattr(self.args, "values", None)
        if self.instance_name is None:
            self.raise_parser_error(
                "You must specify an instance name with `--instance INSTANCE`."
            )
        if self.instance_tag is None and "install" in self.stages_to_run:
            self.raise_parser_error(
                "You must specify `--tag` to install an instance."
            )
        if self.sim_start_time is None:
            self.sim_start_time = (
                datetime.now(timezone.utc) - timedelta(hours=8)
            ).strftime("%Y-%m-%dT%H:00:00Z")
            self.args.sim_start_time = self.sim_start_time

    #
    # Override additional methods from `GMSKubeWrapper`.
    #

    def create_install_commands(self) -> list[str]:
        """
        Create the command(s) needed to install the instance.  This
        overrides :func:`GMSKubeWrapper.create_install_commands`, which
        is used by the `install` stage provided by that base class.

        Returns:
            The command(s) to execute in the underlying shell.
        """
        return [
            "gmskube install " + " ".join(self.get_gmskube_install_args())
            + f" {self.instance_name}"
        ]

    #
    # Override additional methods from `DriverScript`.
    #

    def print_script_execution_summary(
        self,
        extra_sections: dict[str,
                             str] | None = None
    ) -> None:
        """
        Print a summary of everything that was done by the script.
        """
        ui_url = (
            self.get_ingress_for_service("interactive-analysis-ui")
            if self.instance_exists else ""
        )
        extras = {"UI URL": ui_url} if ui_url else {}
        if extra_sections is not None:
            extras |= extra_sections
        super().print_script_execution_summary(extra_sections=extras)

    #
    # Define additional helper methods.
    #

    def get_gmskube_install_args(self) -> list[str]:
        """
        Create the arguments to pass on to the ``gmskube install``
        command.  These include arguments specific to this script, plus
        any ``gmskube install`` options passed in on the command line
        (see ``ian_sim_deploy.py --help``).

        Returns:
            The list of arguments.
        """
        args = [
            "--augment bridged-data-source-simulator",
            "--augment oracle",
            "--istio" if self.istio else "--no-istio",
            f"--set interactive-analysis-ui.env.NODE_ENV={self.node_env}",
            f"--tag {self.instance_tag}",
            f"--timeout {self.gmskube_timeout}",
            "--type ian",
            (
                "--values " + str(
                    Path(__file__).resolve().parents[3]
                    / "deploy/custom-values/ORG/simulator.yaml"
                )
            )
        ]
        if not self.keycloak:
            args.append(
                "--set "
                "interactive-analysis-ui.env.GMS_DISABLE_KEYCLOAK_AUTH=true"
            )
        if self.config_override_path:
            args.append(
                f"--config {self.config_override_path}"
            )
        args.extend(
            f"--set {quote_arg_if_necessary(value)}"
            for value in (self.sets or [])
        )
        args.extend(
            f"--set-string {quote_arg_if_necessary(value)}"
            for value in (self.set_strings or [])
        )
        args.extend(f"--values {_}" for _ in self.values or [])
        return sorted(args)

    #
    # Define additional stage actions.  See the docstrings for
    # `DriverScript.stage` and associated methods if you need details on
    # this power-user functionality.
    #

    def _run_post_stage_actions_wait(self) -> None:
        """
        If we've given up on waiting for the instance to be ready,
        make it such that we skip over any future stages.
        """
        super()._run_post_stage_actions_wait()
        if not self.pods_ready:
            self.stages_to_run -= (self.stages - {"install", "wait"})


if __name__ == "__main__":  # pragma: no coverage
    script = IANSimDeploy({
        "install",
        "wait",
        "init",
        "start",
        "stop",
        "clean",
        "status",
        "uninstall"
    })
    script.main(sys.argv[1:])
