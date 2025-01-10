#!/usr/bin/env python3

import secrets
import shlex
import string
import sys
import zipfile
import uuid
from argparse import (ArgumentParser, BooleanOptionalAction, SUPPRESS)
from collections import defaultdict
from minio import Minio
from pathlib import Path
from rich.progress import track
from signal import SIGINT, signal
from tenacity import RetryCallState
from time import sleep

sys.path.append(str(Path(__file__).resolve().parents[4] / "python"))
from driver_script import DriverScript, RetryStage, lazy_property  # noqa: E402
from gmskube import ArgTypes, Parsers  # noqa: E402
from gmskube_wrapper import GMSKubeWrapper  # noqa: E402
from ian_sim_deploy import IANSimDeploy  # noqa: E402
from kubectl import KubeCtl  # noqa: E402
from simulator_mixin import SimulatorMixin  # noqa: E402


class GMSSystemTest(SimulatorMixin, GMSKubeWrapper):
    """
    This class is designed to handle our automated testing against
    running instances of the system.  It contains the following stages:

    Install
        Install an instance of the system for testing purposes.
    Wait
        Wait for all the pods to reach a "Running" or "Succeeded" state.
    Sleep
        Sleep an additional amount of time to wait for the applications
        in all the pods to be ready to process data.
    Test
        Apply a test augmentation to the running instance of the system
        and collect the results.
    Uninstall
        Uninstall the instance now that testing is complete.

    Note:
        Additional stages used when testing ``ian`` instances are
        provided by the :class:`SimulatorMixin`.

    Attributes:
        calib_update_freq (str):  The simulator's calibration update
            frequency.
        ian_sim_deploy (IANSimDeploy):  Used for installing an IAN
            instance and initializing the simulator.
        instance_type (str):  The type of GMS instance to install.
        kubectl_gms (KubeCtl):  A :class:`KubeCtl` instance for the
            ``gms`` namespace.
        minio (dict):  The information needed to communicate with the
            MinIO test reporting service.
        op_time_period (str):  The simulator's operational time period.
        parallel (int):  How many identical test augmentation pods to
            launch in parallel.
        reports_dir (Path):  The directory for collecting test reports.
        seed_end_time (str):  The end time for the seed data when
            initializing the simulator.
        seed_start_time (str):  The start time for the seed data when
            initializing the simulator.
        set_args (list[str]):  The ``--set`` arguments to pass to
            ``gmskube`` when applying the test augmentation.
        sleep (int):  How many seconds to sleep while waiting for the
            system to be ready.
        sim_start_time (str):  The simulation start time.
        simulator (bool): IAN bridged datasource simulator enabled
        state_timeout (int):  How long to wait (in minutes) for the
            simulation to transition to a desired state.
        test_attempt (int):  A counter for the number of times a test
            has been attempted.
        test_name (str):  The name of the test to run.
        test_success (bool):  Whether the tests passed successfully.
        values (str):  The path to a values override YAML file.

    Note:
        Additional attributes are defined in the :class:`DriverScript`
        and :class:`GMSKubeWrapper` base classes.
    """

    def __init__(self, stages: set[str]):
        """
        Initialize a :class:`GMSSystemTest` object.

        Args:
            stages:  The set of stages to register for this instance.
                This may be a subset of all the stages defined in the
                class.
        """
        super().__init__(stages)
        self.kubectl_gms = KubeCtl("gms")
        self.minio = {
            "access_key": str(uuid.uuid4()),
            "augmentation_name": "minio-test-reports",
            "report_bucket": "reports",
            "secret_key": str(uuid.uuid4())
        }
        self.set_args = None
        self.sleep = None
        self.test_attempt = 0
        self.test_name = None
        self.test_success = False
        self.simulator = False

    def main(self, argv: list[str]) -> None:
        """
        This method handles
        * standing up an instance of the GMS system,
        * waiting for all the pods to come up,
        * waiting for the application to be ready,
        * running a test augmentation against the system, and
        * tearing down the instance.

        Args:
            argv:  The command line arguments used when running this
                file as a script.

        Raises:
            RuntimeError:  If the user forgot to pass in the instance
                name.
            SystemExit(0):  If everything passes successfully.
            SystemExit(1):  If any test fails, or if anything else goes
                wrong.
        """
        self.parse_args(argv)
        signal(SIGINT, self.keyboard_interrupt_handler)
        try:
            self.install_instance()
            self.wait_for_all_pods_ready()
            if self.simulator:
                self.initialize_simulator()
                self.start_simulator()
            self.sleep_after_pods_ready()
            self.run_test()
            self.uninstall_instance()
        except Exception:
            self.uninstall_on_exception()
        finally:
            self.print_script_execution_summary()
            if not self.script_success:
                raise SystemExit(1)

    #
    # Parse the command line arguments.
    #

    @lazy_property
    def parser(self) -> ArgumentParser:
        """
        Create an ``ArgumentParser`` that contains all the necessary
        arguments for this script.

        Returns:
            The argument parser for this script.
        """
        ap = super().parser
        ap.description = (
            "This script:\n"
            "* stands up a temporary instance of the GMS system,\n"
            "* waits for all the pods to be up and running,\n"
            "* sleeps a given amount of time to wait for the application to "
            "be ready,\n"
            "* runs a test augmentation against it, and\n"
            "* tears down the temporary instance after testing completes.\n\n"
            "Test augmentations, which run in a pod on a Kubernetes cluster, "
            "copy their test results to a MinIO test reporting service so "
            "that they can be gathered back to the machine on which this "
            "script was executed.  Final reports will be gathered in a "
            "``gms_system_test-reports-{timestamp}-{unique-str}`` directory "
            "under the current working directory.  Additionally a "
            "``gms_system_test-container-logs-{timestamp}-{unique-str}`` "
            "directory will contain logs from all the containers run as part "
            "of the testing."
        )
        ap.epilog = (
            "examples:\n"
            "  Here are some standard use cases.\n\n"
            "  Run the ``jest`` test against a ``ian`` instance with seed data deployed from "
            "the ``develop`` branch::\n\n"
            "      gms_system_test.py --type ian --no-simulator --tag develop --test jest\n\n"
            "  Verify that it's possible to install/uninstall ``ian`` with simulator, but "
            "don't test anything::\n\n"
            "      gms_system_test.py --type ian --tag develop --stage "
            "install wait init start uninstall"
        )
        ap.set_defaults(
            install_retry_attempts=2,
            install_retry_timeout=600,
            save_logs=True,
            stage=self.stages,
            test_retry_attempts=5,
            test_retry_delay=0,
            test_retry_timeout=1200,
            wait_timeout=900
        )
        Parsers.add_type_args(ap)
        ap.add_argument(
            "--sleep",
            default=0,
            type=int,
            help="How long to wait between the pods reaching a 'Ready' "
            "state and starting the test."
        )
        ap.add_argument(
            "--test",
            help="The name of a test to run (see ``gmskube augment catalog "
            "--tag <reference>``)."
        )
        ap.add_argument(
            "--env",
            type=ArgTypes.set,
            action="append",
            help="Set environment variables in the test environment.  This "
            "argument can be specified multiple times to specify multiple "
            "values.  Example:  ``--env FOO=bar`` will set ``FOO=bar`` for "
            "the test."
        )
        ap.add_argument(
            "--parallel",
            default=1,
            type=int,
            choices=range(1, 11),
            help="How many identical test augmentation pods to launch in "
            "parallel."
        )  # yapf: disable
        ap.add_argument(
            "--simulator",
            default=True,
            action=BooleanOptionalAction,
            help="Whether to enable and IAN bridged datasource simulator"
        )
        install_group = ap.add_argument_group(
            "install",
            "Additional options to pass on to ``gmskube install``."
        )
        Parsers.add_values_args(install_group)
        for stage in {"wait", "init", "start", "sleep", "uninstall"}:
            for arg in {"attempts", "delay", "timeout"}:
                getattr(self, f"{stage}_retry_{arg}_arg").help = SUPPRESS
        return ap

    def create_set_args(
        self,
        env_args: list[str] | None
    ) -> list[str]:  # yapf: disable
        """
        Create a list of ``--set`` arguments to pass to ``gmskube`` when
        applying the test augmentation.  This translates any ``--env``
        arguments passed to this script into the appropriate
        ``--set env.foo=bar`` form, and also sets the number of
        identical pods to launch if ``parallel`` is greater than 1.

        Args:
            env:  The (potentially empty or nonexistent) list of all the
                environment variables to be set for the test.

        Returns:
            The list of ``--set`` arguments.
        """
        set_args = defaultdict(list)
        for item in env_args or []:
            name, value = item.split("=", 1)
            if "." in name:
                test_name, name = name.split(".", 1)
            else:
                test_name = "global"
            set_args[test_name].append(f'--set env.{name}="{value}"')
        result = set_args["global"] + set_args[self.test_name]
        if self.parallel > 1:
            result.append(f"--set numIdenticalPods={self.parallel}")
        return result

    def parse_args(self, argv: list[str]) -> None:
        """
        Parse the command line arguments, and handle any special cases.

        Args:
            argv:  The command line arguments used when running this
                file as a script.

        Raises:
            SystemExit:  If the user doesn't specify a test to run, or
                if they don't provide the right combination of flags.
        """
        super().parse_args(argv)
        if self.args.env == [""]:
            self.args.env = []
        if "test" in self.args.stage and not self.args.test:
            self.raise_parser_error(
                "You must specify which test to run via the `--test` flag.  "
                "Run `gmskube augment catalog --tag <reference>` to see the "
                "available tests."
            )
        self.instance_type = self.args.type
        self.parallel = self.args.parallel
        self.set_args = self.create_set_args(self.args.env)
        self.simulator = self.args.simulator
        self.sleep = self.args.sleep
        self.test_name = self.args.test
        self.test_retry_attempts = self.args.test_retry_attempts
        self.test_retry_delay = self.args.test_retry_delay
        self.test_retry_timeout = self.args.test_retry_timeout
        self.values = getattr(self.args, "values", None)
        if (
            "install" in self.stages_to_run
            and (self.instance_tag is None or self.instance_type is None)
        ):
            self.raise_parser_error(
                "You must specify `--tag` and `--type` to install an instance."
            )
        if (
            self.instance_type is not None
            and self.instance_type not in ["ian"]
        ):  # yapf: disable
            self.raise_parser_error(
                "The `--type` must be `ian`."
            )

    #
    # Define the stages of the script.
    #

    @DriverScript.stage(
        "sleep",
        "Sleeping to allow the application to be ready..."
    )
    def sleep_after_pods_ready(self) -> None:
        """
        This is intended to be used after :func:`check_all_pods_ready`
        such that we can wait for the applications within each pod to be
        ready to process data.
        """
        if self.dry_run:
            self.print_dry_run_message("Skipping this step.")
            return
        self.commands_executed.append(f"sleep {self.sleep}")
        time_to_sleep = track(
            range(self.sleep),
            description=(" " * 11),
            console=self.console
        )
        for _ in time_to_sleep:
            sleep(1)

    @DriverScript.stage("test", "Running the specified test...")
    def run_test(self) -> None:
        """
        Apply the test augmentation to the system, wait for it to
        complete, and retrieve the test results.

        Raises:
            RuntimeError:  If the test job fails to start for some
                reason.
            RetryStage:  If the test was unsuccessful.
        """
        self.test_attempt += 1
        self.apply_test_augmentation()
        if self.dry_run:
            self.test_success = True
            return
        if self.kubectl.resource_failed_to_start(f"jobs/{self.test_name}"):
            raise RuntimeError(
                f"'{self.test_name}' failed to start; aborting."
            )
        self.kubectl.wait(
            f"jobs/{self.test_name}",
            timeout=self.test_retry_timeout
        )
        self.console.log(f"Collecting results from '{self.test_name}'")
        self.test_success = self.retrieve_test_results()
        if self.test_success:
            self.console.log(f"[bold green]{self.test_name} PASSED")
        else:
            self.console.log(f"[bold red]{self.test_name} FAILED")
            raise RetryStage

    #
    # Override additional methods from `GMSKubeWrapper`.
    #

    def create_install_commands(self) -> list[str]:
        """
        Create the commands to install the testing instance.

        Returns:
            The command(s) to execute.
        """
        if self.simulator:
            return self.ian_sim_deploy.create_install_commands()
        else:
            # minio-test-reports only gets added when there is no simulator
            return [
                f"gmskube install --tag {self.instance_tag} --type "
                "ian --augment oracle --augment minio-test-reports "
                f"--set augmentation.minio-test-reports.minioReportBucket={self.minio['report_bucket']} "
                f"--set augmentation.minio-test-reports.minioAccessKey={self.minio['access_key']} "
                f"--set augmentation.minio-test-reports.minioSecretKey={self.minio['secret_key']} "
                "--set interactive-analysis-ui.env.GMS_DISABLE_KEYCLOAK_AUTH=true "
                + "".join(f"--values {_} " for _ in self.values or [])
                + f"{self.instance_name}"
            ]

    #
    # Override additional methods from `DriverScript`.
    #

    def print_script_execution_summary(
        self,
        extra_sections: dict[str, str] | None = None
    ) -> None:
        """
        Print a summary of everything that was done by the script.
        """
        extras = (
            {"Test reports": str(self.reports_dir)}
            if hasattr(self, "reports_dir") else {}
        )
        if extra_sections is not None:
            extras |= extra_sections
        super().print_script_execution_summary(extra_sections=extras)

    #
    # Define additional helper methods.
    #

    def create_unique_instance_name(self) -> str:
        """
        Create a unique name for this instance of the system.

        Returns:
            The unique instance name, which is of the form
            ``gms-system-test-<random-string>``.
        """
        prefix = "gms-system-test"
        alphabet = string.ascii_lowercase + string.digits
        random_string = "".join(secrets.choice(alphabet) for _ in range(10))
        instance_name = f"{prefix}-{random_string}"
        self.console.log(
            f"`GMSSystemTest` will create an instance named `{instance_name}` "
            "for testing purposes."
        )
        return instance_name

    def apply_test_augmentation(self) -> None:
        """
        Apply the test augmentation to the system.
        """
        command = (
            f"gmskube augment apply --tag {self.instance_tag} --name "
            f"{self.test_name} {' '.join(self.set_args)} "
            f"{self.instance_name}"
        )
        self.run(command, pretty_print=True, shell=True)

    def _get_minio_endpoint(self) -> str:
        """
        Determine the ingress endpoint for the ``minio-test-reports``
        augmentation.

        Raises:
            RuntimeError:  If it's not possible to determine the host,
                port, or path.

        Returns:
            The host, port, and path.
        """
        host, paths = self.kubectl.get_endpoints(
            self.minio["augmentation_name"]
        )
        if host is None or paths is None:
            raise RuntimeError(
                f"Failed to locate the `{self.minio['augmentation_name']}` "
                "endpoint."
            )
        ports = self.kubectl_gms.get_resource("configmap/ingress-ports-config")
        if not ports:
            raise RuntimeError(
                "Failed to get the port for the "
                f"`{self.minio['augmentation_name']}` endpoint."
            )
        ports = ports[0]["data"]
        path = paths[0]
        if self.kubectl.istio_enabled():
            port = ports["istio_port"]
        else:
            port = ports["nginx_port"]
        return f"{host}:{port}{path}"

    @lazy_property
    def minio_client(self) -> Minio:
        """
        Create a :class:`Minio` client for the ``minio-test-reports``
        augmentation.

        Raises:
            RuntimeError:  If the client can't be created, or if the
                report bucket can't be found.

        Returns:
            The MinIO client.
        """
        endpoint = self._get_minio_endpoint()
        client = Minio(
            endpoint,
            access_key=self.minio["access_key"],
            secret_key=self.minio["secret_key"]
        )
        if client is None:
            raise RuntimeError(
                f"Failed to connect to MinIO endpoint '{endpoint}'.  No "
                "results can be retrieved."
            )
        if not client.bucket_exists(self.minio["report_bucket"]):
            raise RuntimeError(
                f"Unable to locate the '{self.minio['report_bucket']}' "
                f"container in the MinIO endpoint '{endpoint}'.  No results "
                "can be retrieved."
            )
        return client

    def extract_minio_object(
        self,
        file_name: str,
        local_filepath: Path,
        results_dir: Path
    ) -> None:
        """
        Retrieve a zip file from the Minio report bucket and
        unzip it to the results directory.

        Args:
            file_name:  The name of the file to retrieve.
            local_filepath:  Where to store it locally on disk.
            results_dir:  Where to extract the results to.
        """
        self.minio_client.fget_object(
            self.minio["report_bucket"],
            file_name,
            str(local_filepath)
        )
        with zipfile.ZipFile(local_filepath, "r") as zip_file:
            zip_file.extractall(results_dir)
        local_filepath.unlink()

    def pod_succeeded(self, output_file: Path) -> bool:
        """
        Determine the success or failure of the test augmentation pod by
        parsing its output.

        Args:
            output_file:  The file to parse.

        Raises:
            RuntimeError:  If the appropriate result string cannot be
                found in the file.

        Returns:
            ``True`` if the pod succeeded; ``False`` if not.
        """
        with open(output_file) as f:
            output = f.read()
            if "TEST AUGMENTATION POD RESULT:  SUCCESS" in output:
                return True
            elif "TEST AUGMENTATION POD RESULT:  FAILURE" in output:
                return False
            else:
                raise RuntimeError(
                    "Didn't find 'TEST AUGMENTATION POD RESULT' in "
                    f"'{output_file}'."
                )

    def retrieve_test_results(self) -> bool:
        """
        Retrieve one or more compressed zip files containing test
        results from the MinIO test reporting service.

        Returns:
            Whether or not testing passed.
        """
        results_dir = (
            self.reports_dir / f"{self.test_name}-{self.test_attempt}"
        )
        results_dir.mkdir()
        results = [_.object_name for _ in
                   self.minio_client.list_objects(self.minio["report_bucket"])]
        num_results = 0
        pod_success = []
        for file_name in results:
            if self.test_name not in file_name:
                continue
            num_results += 1
            local_filepath = results_dir / file_name
            self.extract_minio_object(file_name, local_filepath, results_dir)
            output_file = results_dir / local_filepath.stem / "testrun.txt"
            pod_success.append(self.pod_succeeded(output_file))
        if num_results < self.parallel:
            raise RuntimeError(
                f"Expecting {self.parallel} results objects in the "
                f"'{self.minio['report_bucket']}' MinIO bucket; only found "
                f"{num_results}."
            )
        return all(pod_success or [False])

    def _delete_test_augmentation(self) -> None:
        """
        Delete the test augmentation from the system.
        """
        command = (
            f"gmskube augment delete --tag {self.instance_tag} --name "
            f"{self.test_name} {self.instance_name}"
        )
        self.run(command, pretty_print=True, shell=True)

    def _remove_minio_results(self) -> None:
        """
        Remove any results associated with the test augmentation from
        the MinIO report bucket.
        """
        results = [_.object_name for _ in
                   self.minio_client.list_objects(self.minio["report_bucket"])]
        for file_name in results:
            if self.test_name in file_name:
                self.minio_client.remove_object(
                    self.minio["report_bucket"],
                    file_name
                )

    def keyboard_interrupt_handler(self, signal_number, stack_frame):
        """
        Clean-up operations for when the user hits Ctrl+C in the midst
        of a run.

        Args:
            signal_number:  Not used.
            stack_frame:  Not used.

        Raises:
            SystemExit:  To indicate that the script completed with an
                error.
        """
        self.console.log(
            "[yellow]Caught a keyboard interrupt signal.  Attempting to tear "
            "down the testing instance so we don't leave it lying around.  If "
            "you hit CTRL+C again, you'll need to manually delete this "
            "instance."
        )
        self.script_success = False
        self.uninstall_instance()
        raise SystemExit(1)

    def uninstall_on_exception(self) -> None:
        """
        In the event of an exception, try not to leave the testing
        instance lying around.
        """
        self.script_success = False
        self.console.print_exception()
        self.uninstall_instance()

    #
    # Define additional stage actions.  See the docstrings for
    # `DriverScript.stage` and associated methods if you need details on
    # this power-user functionality.
    #

    def _run_pre_stage_actions_install(self) -> None:
        """
        Before running the ``install`` stage, ensure the instance name
        is defined.  If it's not, create one.  Also create a
        :class:`KubeCtl` object for use in this and future stages, and
        hook :class:`IANSimDeploy` into this class for when testing
        ``ian`` instances.
        """
        self._run_pre_stage_actions()
        if self.instance_name is None:
            self.instance_name = self.create_unique_instance_name()
        self.kubectl = KubeCtl(self.instance_name)
        if self.simulator:
            self.set_ian_sim_deploy_attributes()

    def set_ian_sim_deploy_attributes(self):
        """
        Create an instance of :class:`IANSimDeploy`, parse the arguments
        needed for our purposes here, and creates class attributes
        linked to the corresponding attributes in :class:`IANSimDeploy`,
        such that this class will be able to create the correct install
        commands and initialize/start the simulator.
        """
        self.ian_sim_deploy = IANSimDeploy(set())
        self.ian_sim_deploy.parse_args(
            shlex.split(
                f"--instance {self.instance_name} "
                f"--tag {self.instance_tag} "
                "--no-keycloak "
                "--node-env development "
                + "".join(f"--values {_} " for _ in self.values or [])
            )
        )
        self.seed_start_time = self.ian_sim_deploy.seed_start_time
        self.seed_end_time = self.ian_sim_deploy.seed_end_time
        self.sim_start_time = self.ian_sim_deploy.sim_start_time
        self.op_time_period = self.ian_sim_deploy.op_time_period
        self.calib_update_freq = self.ian_sim_deploy.calib_update_freq
        self.state_timeout = self.ian_sim_deploy.state_timeout

    def _run_post_stage_actions_wait(self) -> None:
        """
        If we've given up on waiting for the instance to be ready,
        make it such that we skip over the rest of the stages except
        'uninstall'.
        """
        super()._run_post_stage_actions_wait()
        if not self.pods_ready:
            self.stages_to_run -= {"init", "start", "sleep", "test"}

    def _run_pre_stage_actions_test(self) -> None:
        """
        Before entering the 'test' stage, ensure the
        :attr:`instance_tag` is set, as future stages will require it.
        Also create the reports directory, if needed.

        Raises:
            RuntimeError:  If the tag isn't set and we're not able to
                determine it.
        """
        if self.instance_tag is None:
            if labels := self.kubectl.get_configmap_labels("gms"):
                self.instance_tag = labels["gms/image-tag"]
            else:
                raise RuntimeError(
                    "Unable to determine the instance tag, which is needed "
                    "for future stages."
                )
        if "test" in self.stages_to_run:
            self.reports_dir = self.make_unique_dir(
                f"{self.script_stem}-reports"
            )

    def _run_post_stage_actions_test(self) -> None:
        """
        If the 'test' stage was run, set the script success based on the
        test result.
        """
        if "test" in self.stages_to_run:
            self.script_success = self.pods_ready and self.test_success

    def _prepare_to_retry_stage_test(
        self,
        retry_state: RetryCallState
    ) -> None:
        """
        In preparation for rerunning a failed test augmentation, clean
        things up so the system is ready for the augmentation to be
        applied again.

        Args:
            retry_state:  Information regarding the retry operation in
                progress.
        """
        self._prepare_to_retry_stage(retry_state)
        self.ensure_log_dir_exists()
        self.kubectl.save_resource_logs(self.test_name, "job", self.log_dir)
        self._delete_test_augmentation()
        self._remove_minio_results()
        self.console.log("[bold yellow]Retrying the failed test...")


if __name__ == "__main__":
    gst = GMSSystemTest({
        "install",
        "wait",
        "init",
        "start",
        "sleep",
        "test",
        "uninstall"
    })
    gst.main(sys.argv[1:])
