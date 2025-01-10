#!/usr/bin/env python3
import os
import secrets
import string
import sys
from argparse import ArgumentParser, BooleanOptionalAction
from datetime import datetime
from pathlib import Path
from subprocess import DEVNULL
from threading import Thread
from time import sleep

from rich.console import Group
from rich.live import Live
from rich.padding import Padding
from rich.panel import Panel
from tenacity import RetryCallState, RetryError

sys.path.append(str(Path(__file__).resolve().parents[3] / "python"))
from driver_script import DriverScript, RetryStage, lazy_property  # noqa: E402
from gmskube import Parsers  # noqa: E402
from kubectl import KubeCtl  # noqa: E402


class GMSKubeWrapper(DriverScript):
    """
    This serves as a base class for any Python scripts intended to wrap
    a series of calls to ``gmskube`` commands.  It extends
    :class:`DriverScript` to provide the following stages:

    Install
        Install an instance of GMS.
    Wait
        Wait for all the pods to be ready.
    Uninstall
        Uninstall the instance.

    Attributes:
        instance_exists (bool):  Whether the instance specified by the
            user exists.
        instance_name (str):  The name of the instance.
        instance_tag (str):  The name of the Docker image tag.
        kubectl (KubeCtl):  A :class:`KubeCtl` object initialized with
            ``instance_name`` as the namespace.
        log_dir (Path):  The directory in which to save the container
            logs.
        logs_saved (bool):  Whether the logs have been saved yet.
        pods_ready (bool):  Whether all pods in the instance are ready.
        save_logs (bool):  Whether to save the container logs.
        wait_timeout (int):  How long to wait (in seconds) for all the
            pods to be ready.
    """

    def __init__(self, stages: set[str]):
        """
        Initialize a :class:`GMSKubeWrapper` object.

        Args:
            stages:  The set of stages to register for a
                :class:`GMSKubeWrapper` subclass.  This may be a subset
                of all the stages defined in the subclass.

        Note:
            If you override this constructor in a subclass---e.g., to
            create additional attributes, etc.---you'll need to call
            this parent constructor with ``super().__init__(stages)``
            and optionally pass in additional arguments.
        """
        super().__init__(
            stages=stages,
            console_force_terminal=(True if os.getenv("CI") else None),
            console_log_path=bool(os.getenv("RICH_LOG_PATH"))
        )
        self.instance_exists = False
        self.logs_saved = False
        self.pods_ready = False

    #
    # Parse the command line arguments.
    #

    @lazy_property
    def parser(self) -> ArgumentParser:
        """
        Create an :class:`ArgumentParser` for all the arguments made
        available by this base class.  This should be overridden in
        subclasses.  See :func:`DriverScript.parser` for details.
        """
        ap = super().parser
        ap.description = """
This is the description of the `ArgumentParser` in the `GMSKubeWrapper`
base class.  This should be overridden in your subclass.  See the
`DriverScript.parser` docstring for details.
"""
        ap.add_argument(
            "--instance",
            default=None,
            help="The name of the GMS instance."
        )
        ap.add_argument(
            "--log-dir",
            default=None,
            type=Path,
            help="The directory in which to save the container logs.  "
            f"Defaults to `{self.script_stem}-container-logs-"
            "<timestamp>-<unique-str>`."
        )
        ap.add_argument(
            "--save-logs",
            action=BooleanOptionalAction,
            default=False,
            help="Whether to save the container logs."
        )
        Parsers.add_tag_args(ap)
        ap.add_argument(
            "--wait-timeout",
            default=60,
            type=int,
            help="How long to wait (in seconds) for all the pods in the "
            "instance to be ready."
        )
        return ap

    def parse_args(self, argv: list[str]) -> None:
        """
        Parse the command line arguments supplied by this base class.
        This should be overridden in subclasses.  See
        :func:`DriverScript.parse_args` for details.

        Args:
            argv:  The command line arguments used when running this
                file as a script.
        """
        super().parse_args(argv)
        self.instance_name = self.args.instance
        self.instance_tag = self.args.tag
        self.log_dir = self.args.log_dir
        self.save_logs = self.args.save_logs
        self.wait_timeout = self.args.wait_timeout
        if self.log_dir is not None and not self.save_logs:
            self.raise_parser_error(
                "You're specifying `--log-dir` and `--no-save-logs`, which "
                "doesn't make sense."
            )

    #
    # Define the stages of the script.
    #

    @DriverScript.stage("install", "Installing an instance of GMS...")
    def install_instance(self) -> None:
        """
        Install an instance of GMS.

        Raises:
            RetryStage:  If the installation fails.
        """
        for command in self.create_install_commands():
            return_code = self.run(
                command,
                pretty_print=True,
                shell=True
            ).returncode
            if return_code != 0:
                raise RetryStage
        self.instance_exists = True

    @DriverScript.stage("wait", "Waiting for all the pods to be ready...")
    def wait_for_all_pods_ready(self) -> None:
        """
        Wait for all the pods in the instance to be ready.
        """
        if self.dry_run:
            self.print_dry_run_message("Skipping this step.")
            self.pods_ready = True
            return
        try:
            self.commands_executed.append("# Wait for all pods to be ready.")
            with Live(
                self.get_pod_info(),
                refresh_per_second=1,
                console=self.console
            ) as live:
                self.kubectl.wait_for_all_pods_ready(
                    timeout=self.wait_timeout,
                    before_sleep=(
                        lambda retry_state: live.update(self.get_pod_info())
                    )
                )
                live.update(self.get_pod_info(force_table=True))
            self.console.log("[green]All pods are ready.")
            self.pods_ready = True
        except RuntimeError as e:
            self.console.log(f"[red]{e}")
            self.pods_ready = False
        except RetryError:
            self.console.log("[red]Not all pods are ready.")
            self.pods_ready = False

    @DriverScript.stage("uninstall", "Uninstalling the instance...")
    def uninstall_instance(self) -> None:
        """
        Tear down the instance of the system.
        """
        if not self.script_success:
            self.console.print(self.get_pod_info(force_table=True))
        command = f"gmskube uninstall {self.instance_name}"
        self.run(command, shell=True)
        self.instance_exists = False

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
        extras = {}
        if self.logs_saved:
            extras["Container logs"] = str(self.log_dir)
        extras["Cluster"] = KubeCtl.get_current_context()
        if extra_sections is not None:
            extras |= extra_sections
        super().print_script_execution_summary(extra_sections=extras)

    #
    # Define additional helper methods.
    #

    def ensure_instance_exists(self) -> None:
        """
        Ensure the instance exists.

        Raises:
            RuntimeError:  If it doesn't.
        """
        if self.dry_run:
            return
        if not self.instance_exists:
            self.console.log(
                f"Ensuring the {self.instance_name!r} instance exists."
            )
            self.instance_exists = (
                self.run(
                    f"gmskube ls {self.instance_name}",
                    print_command=False,
                    shell=True,
                    stdout=DEVNULL,
                    stderr=DEVNULL
                ).returncode == 0
            )
        if not self.instance_exists:
            raise RuntimeError(
                f"The {self.instance_name!r} instance doesn't exist."
            )

    def create_install_commands(self) -> list[str]:
        """
        Create the command(s) needed to install the instance.

        Note:
            This method must be overridden in your
            :class:`GMSKubeWrapper` subclass.

        Returns:
            The command(s) to execute in the underlying shell.
        """
        return [
            "echo 'You must override create_install_commands() in your "
            "GMSKubeWrapper subclass.'"
        ]

    def get_pod_info(self, force_table: bool = False) -> Padding:
        """
        Get information about all the pods in the instance.  For the
        user in the terminal, display the table of pod information
        returned by ``kubectl get pods``.  For CI, only display one pod
        that is not yet ready, unless :arg:`force_table` is ``True``.

        Args:
            force_table:  Whether to force returning the pod information
                table (``True``), or return content based on the ``CI``
                environment variable (``False``).

        Returns:
            The relevant pod information, wrapped in a
            :class:`rich.padding.Padding`.
        """
        pod_table = self.kubectl.get_pods()
        not_running, not_ready = [], []
        for line in pod_table.splitlines()[1:]:
            name, ready, status = line.split()[:3]
            if status not in ["Running", "Completed"]:
                not_running.append(name)
                continue
            if status == "Running":
                containers_ready, total_containers = ready.split("/")
                if containers_ready != total_containers:
                    not_ready.append(name)
        if (
            not force_table and os.getenv("CI") and (not_running or not_ready)
        ):
            pod_not_ready = not_running[0] if not_running else not_ready[0]
            info = f"Waiting for pod:  {pod_not_ready}"
        else:
            info = Panel(
                pod_table,
                title=f"Pods for Instance {self.instance_name!r}",
                expand=False
            )
        return Padding(info, (0, 0, 0, 11))

    @staticmethod
    def make_unique_dir(prefix: str, parent: Path = Path.cwd()) -> Path:
        """
        Create a uniquely-named directory, where the name follows the
        patter ``<prefix>-<timestamp>-<unique-str>``.

        Args:
            prefix:  What the directory name should start with.
            parent:  The parent directory in which to create the new
                directory.

        Returns:
            The :class:`Path` object pertaining to the new directory.
        """
        alphabet = string.ascii_lowercase + string.digits
        randomizer = "".join(secrets.choice(alphabet) for _ in range(5))
        unique_name = f"{prefix}-{datetime.now():%Y%m%dT%H%M%S}-{randomizer}"
        unique_dir = parent / unique_name
        unique_dir.mkdir(parents=True)
        return unique_dir

    def get_log_file_info(self) -> Padding:
        """
        Get information about the files being generated in the :attr:`log_dir`.
        For a user running in the terminal, list all the files, sorted by
        creation time, wrapped in a panel.  For CI, get only the
        most recently saved log file.

        Returns:
            A :class:`rich.padding.Padding` renderable with the
            appropriate contents.
        """
        files = sorted(
            [str(f.relative_to(self.log_dir)) for f in self.log_dir.iterdir()],
            key=(lambda file_name: (self.log_dir / file_name).stat().st_mtime)
        )
        latest_file = files[-1] if files else ""
        info = (
            f"Saving logs:  {latest_file}" if os.getenv("CI") else
            Panel(Group(*files),
                  title="Saving Logs",
                  expand=False)
        )
        return Padding(info, (0, 0, 0, 11))

    def log_saver(self) -> None:
        """
        The method :func:`save_logs` executes in a separate thread to
        save the logs.
        """
        self.kubectl.save_logs(self.log_dir)
        self.logs_saved = True

    def ensure_log_dir_exists(self) -> None:
        """
        Ensure the directory to save the container logs into exists.
        """
        if self.log_dir is None:
            self.log_dir = self.make_unique_dir(
                f"{self.script_stem}-container-logs"
            )
        elif not self.log_dir.exists():
            self.log_dir.mkdir(parents=True)

    def save_container_logs(self) -> None:
        """
        Save the logs for all the containers in the instance.  Execute
        this in a separate thread, so the main thread can show the logs
        saved thus far in a :class:`rich.live.Live` display.
        """
        if not hasattr(self, "kubectl") or self.dry_run or self.logs_saved:
            return
        self.ensure_log_dir_exists()
        with Live(
            self.get_log_file_info(),
            refresh_per_second=1,
            console=self.console
        ) as live:
            log_thread = Thread(target=self.log_saver)
            log_thread.start()
            while not self.logs_saved:
                sleep(1)
                live.update(self.get_log_file_info())
            log_thread.join()

    #
    # Define additional stage actions.  See the docstrings for
    # `DriverScript.stage` and associated methods if you need details on
    # this power-user functionality.
    #

    def _prepare_to_retry_stage_install(
        self,
        retry_state: RetryCallState
    ) -> None:
        """
        In the event that installing the instance fails, try to
        uninstall it before attempting the ``install`` stage again.
        This automated stage retry functionality is provided by the
        :class:`DriverScript` base class.

        Args:
            retry_state:  Information regarding the retry operation in
                progress.
        """
        self._prepare_to_retry_stage(retry_state)
        self.run(f"gmskube uninstall {self.instance_name}", shell=True)

    def _run_post_stage_actions_install(self) -> None:
        """
        If the ``install`` stage was unsuccessful, record the script as
        having failed, and skip any future stages that were to be run.
        """
        self._run_post_stage_actions()
        if not self.instance_exists and "install" in self.stages_to_run:
            self.script_success = False
            self.stages_to_run -= (self.stages - {"install"})

    def _run_general_pre_stage_actions(self) -> None:
        """
        Before we run various stages that may be defined in a
        :class:`GSMKubeWrapper` subclass, we must ensure that:

        * we have an instance name defined,
        * the instance exists, and
        * we have a :class:`KubeCtl` object defined.

        Raises:
            RuntimeError:  If the instance name is not yet defined.
        """
        self._run_pre_stage_actions()
        if self.instance_name is None:
            raise RuntimeError(
                "Ensure `self.instance_name` is defined before the "
                f"{self.current_stage!r} stage executes."
            )
        self.ensure_instance_exists()
        if not hasattr(self, "kubectl"):
            self.kubectl = KubeCtl(self.instance_name)

    def _run_pre_stage_actions_wait(self) -> None:
        """
        Before we wait for all the pods to be ready, we need to run the
        general pre-stage checks.
        """
        self._run_general_pre_stage_actions()

    def _skip_stage_wait(self) -> None:
        """
        If the ``wait`` stage isn't one of the ones to be run, pretend
        that all the pods are ready.
        """
        self._skip_stage()
        self.pods_ready = True

    def _run_post_stage_actions_wait(self) -> None:
        """
        If we've given up on waiting for the instance to be ready,
        record the script as having failed.
        """
        self._run_post_stage_actions()
        if not self.pods_ready:
            self.script_success = False

    def _run_pre_stage_actions_uninstall(self) -> None:
        """
        Before uninstalling the instance, save the logs from all the
        containers in all the pods.
        """
        self._run_general_pre_stage_actions()
        if self.save_logs:
            self.save_container_logs()
