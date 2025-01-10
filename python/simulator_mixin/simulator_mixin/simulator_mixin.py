#!/usr/bin/env python3
import json
import sys
from pathlib import Path
from requests import Response, Session
from requests.adapters import HTTPAdapter
from time import sleep
from urllib3 import Retry as URLRetry

sys.path.append(str(Path(__file__).resolve().parents[3] / "python"))
from driver_script import DriverScript, lazy_property  # noqa: E402
from gmskube_wrapper import GMSKubeWrapper  # noqa: E402


class SimulatorMixin:
    """
    This mixin class provides the stages (see
    :func:`DriverScript.stage`) and methods necessary for any subclasses
    of :class:`GMSKubeWrapper` to interact with the simulator.  The
    stages provided are the following:

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
    """

    #
    # Define the stages supplied by this mixin.
    #

    @DriverScript.stage("init", "Initializing the simulator...")
    def initialize_simulator(self) -> None:
        """
        Post to the simulator's ``initialize`` endpoint and wait for it
        to reach the ``INITIALIZED`` state.
        """
        self.ensure_simulator_state("UNINITIALIZED")
        self.send_request(
            f"{self.simulator_url}/initialize",
            method="POST",
            json={
                "seedDataStartTime": self.seed_start_time,
                "seedDataEndTime": self.seed_end_time,
                "simulationStartTime": self.sim_start_time,
                "operationalTimePeriod": self.op_time_period,
                "calibUpdateFrequency": self.calib_update_freq
            }
        )
        self.wait_for_simulator_state("INITIALIZED")

    @DriverScript.stage("start", "Starting the simulator...")
    def start_simulator(self) -> None:
        """
        Post to the simulator's ``start`` endpoint and wait for it to
        reach the ``STARTED`` state.
        """
        self.ensure_simulator_state(["INITIALIZED", "STOPPED"])
        self.send_request(
            f"{self.simulator_url}/start",
            method="POST",
            json=""
        )
        self.wait_for_simulator_state("STARTED")

    @DriverScript.stage("stop", "Stopping the simulator...")
    def stop_simulator(self) -> None:
        """
        Post to the simulator's ``stop`` endpoint and wait for it to
        reach the ``STOPPED`` state.
        """
        self.ensure_simulator_state("STARTED")
        self.send_request(f"{self.simulator_url}/stop", method="POST", json="")
        self.wait_for_simulator_state("STOPPED")

    @DriverScript.stage("clean", "Cleaning up the simulator...")
    def clean_up_simulator(self) -> None:
        self.ensure_simulator_state([
            "ERROR",
            "INITIALIZED",
            "STOPPED",
            "UNINITIALIZED"
        ])
        self.send_request(
            f"{self.simulator_url}/cleanup",
            method="POST",
            json=""
        )
        self.wait_for_simulator_state("UNINITIALIZED")

    @DriverScript.stage("status", "Checking the simulator status...")
    def check_simulator_status(self) -> None:
        """
        Display the current status of the simulator.
        """
        state = self.get_simulator_state(save_command=True)
        self.console.log(f"The simulator is currently in the {state!r} state.")

    #
    # Define additional helper methods.
    #

    @lazy_property
    def simulator_url(self) -> str:
        """
        Get the ingress URL for the simulator service.

        Raises:
            RuntimeError:  If no URL is returned by ``gmskube ingress``.
        """
        self.console.log("Getting the ingress URL for the simulator.")
        simulator_url = self.get_ingress_for_service(
            "bridged-data-source-simulator"
        )
        if simulator_url == "":
            raise RuntimeError(
                "Unable to determine the simulator URL for instance "
                f"{self.instance_name!r}."
            )
        return simulator_url

    def ensure_simulator_state(self, desired: str | list[str]) -> None:
        """
        Ensure the simulator is in the ``desired`` state.

        Args:
            desired:  One or more states the simulator should be in.

        Raises:
            RuntimeError:  If it's in the wrong state.
        """
        if isinstance(desired, str):
            desired = [desired]
        message = "Ensuring the simulator is in "
        if len(desired) == 1:
            message += f"the {desired[0]!r} state."
        else:
            message += f"one of the following states:  {desired!r}"
        self.console.log(message)
        if self.dry_run:
            self.print_dry_run_message(
                "Assuming the simulator is in the correct state."
            )
            return
        if (current := self.get_simulator_state()) not in desired:
            if len(desired) == 1:
                raise RuntimeError(
                    f"The simulator is in the {current!r} state instead of "
                    f"the {desired[0]!r} state."
                )
            else:
                raise RuntimeError(
                    f"The simulator is currently in the {current!r} state "
                    f"instead of one of the following:  {desired!r}"
                )

    @lazy_property
    def http(self) -> Session:
        """
        Create a HTTP :class:`Session`, with automatic retries for
        certain methods and response statuses, to use for any HTTP
        requests.
        """
        retry_strategy = URLRetry(
            allowed_methods=["POST", "GET"],
            backoff_factor=0.1,
            status_forcelist=[404, 502, 503],
            total=10
        )  # yapf: disable
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session = Session()
        session.mount("https://", adapter)
        return session

    def get_simulator_state(self, save_command: bool = False) -> str:
        """
        Determine which state the simulator is currently in.

        Args:
            save_command:  Whether to save the equivalent ``curl``
                command to the list of commands executed.

        Returns:
            The current state of the simulator, or the empty string if
            it cannot be determined.
        """
        response = self.send_request(
            f"{self.simulator_url}/status",
            method="GET",
            json="",
            save_command=save_command
        )
        return response.text.strip('"') if response is not None else ""

    def wait_for_simulator_state(self, desired: str) -> None:
        """
        Wait for the simulator to reach the ``desired`` state.

        Args:
            desired:  The state the simulator should reach.

        Raises:
            RuntimeError:  If the simulator winds up in the ``ERROR``
                state, or if the desired state is never reached.
        """
        self.console.log(
            f"Waiting for the simulator to reach the {desired!r} state."
        )
        if self.dry_run:
            self.print_dry_run_message(
                "Assuming the simulator is in the correct state."
            )
            return
        SECONDS_PER_MINUTE = 60
        seconds = self.state_timeout * SECONDS_PER_MINUTE
        while (state := self.get_simulator_state()) != desired and seconds > 0:
            if state == "ERROR":
                raise RuntimeError(
                    "The simulator wound up in the `ERROR` state.  Consider "
                    "using `--stage clean` to return it to the "
                    "`UNINITIALIZED` state before proceeding."
                )
            seconds -= 1
            sleep(1)
        if state != desired:
            raise RuntimeError(
                f"The simulator never reached the {desired!r} state.  Current "
                f"state:  {state!r}"
            )

    def send_request(
        self,
        url: str,
        method: str,
        save_command: bool = True,
        **kwargs
    ) -> Response | None:
        """
        Send a request to the given :arg:`url`.

        Args:
            url:  The endpoint to post to.
            method:  The request method to use (``"GET"`` or
                ``"POST"``).
            save_command:  Whether to save the equivalent ``curl``
                command to the list of commands executed.
            **kwargs:  Any additional keyword arguments to pass on to
                the :func:`Session.post` method.

        Returns:
            The response data, or ``None`` in dry-run mode.
        """
        if self.dry_run:
            self.print_dry_run_message(
                f"Skipping sending a {method!r} request to {url!r}."
            )
            return None
        response = (
            self.http.get(url, **kwargs) if method == "GET"
            else self.http.post(url, **kwargs)
        )
        response.raise_for_status()
        if save_command:
            self.commands_executed.append(
                self.pretty_print_command(
                    self.generate_curl_command(response)
                )
            )
        return response

    @staticmethod
    def generate_curl_command(response: Response) -> str:
        """
        Generate a ``curl`` command equivalent to the :class:`Request`
        that produced the given :arg:`response`.

        Args:
            response:  The response from the request.

        Returns:
            The equivalent ``curl`` command.
        """
        request = response.request
        command = f"curl --request {request.method}"
        for key, value in request.headers.items():
            command += f" --header '{key}: {value}'"
        command += " --data "
        data = json.loads(request.body)
        if isinstance(data, str):
            command += r"\'\"\"\'" if data == "" else f"{data!r}"
        else:
            command += (
                "'{"
                + ", ".join([
                    f"\"{key}\": \"{value}\""
                    for key, value in data.items()
                ])
                + "}'"
            )  # yapf: disable
        command += f" {request.url}"
        return command

    def get_ingress_for_service(self, service: str) -> str:
        """
        Get the ingress URL for the given service.

        Args:
            service:  The service for which to get the ingress URL.

        Returns:
            The ingress URL, or the empty string, if no ingress route
            exists for the given service.
        """
        if self.dry_run:
            self.print_dry_run_message("Assuming a dummy ingress URL.")
            return f"https://dry-run.dummy.url/{service}"
        ingress = self.run(
            f"gmskube ingress --service {service} {self.instance_name}",
            print_command=False,
            shell=True,
            capture_output=True
        ).stdout.decode().strip().splitlines()
        return ingress[-1] if ingress else ""


# For each stage, add a method to the `SimulatorMixin` class to
# automatically check that the instance exists at the appropriate time.
for stage in {"init", "start", "stop", "clean", "status"}:
    setattr(
        SimulatorMixin,
        f"_run_pre_stage_actions_{stage}",
        GMSKubeWrapper._run_general_pre_stage_actions
    )
