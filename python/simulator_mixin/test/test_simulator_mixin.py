#!/usr/bin/env python3
from subprocess import CompletedProcess
from time import time
from unittest.mock import MagicMock, patch

import pytest
from requests import HTTPError, Request, Response
from rich.console import Console

from python.simulator_mixin.simulator_mixin.simulator_mixin import (
    SimulatorMixin
)


@pytest.fixture()
def sim_mixin() -> SimulatorMixin:
    mixin = SimulatorMixin()
    mixin._begin_stage = lambda *args: "mocked"
    mixin._end_stage = lambda: "mocked"
    mixin._prepare_to_retry_stage = lambda: "mocked"
    mixin._run_post_stage_actions = lambda: "mocked"
    mixin._run_pre_stage_actions = lambda: "mocked"
    mixin.calib_update_freq = "mocked"
    mixin.commands_executed = []
    mixin.console = Console(log_time=False, log_path=False)
    mixin.dry_run = False
    mixin.ensure_instance_exists = lambda: "mocked"
    mixin.instance_exists = True
    mixin.instance_name = "instance"
    mixin.op_time_period = "mocked"
    mixin.pretty_print_command = lambda command: command
    mixin.print_dry_run_message = lambda message: print(message)
    mixin.seed_end_time = "mocked"
    mixin.seed_start_time = "mocked"
    mixin.sim_start_time = "mocked"
    mixin.state_timeout = 15
    for stage in {"init", "start", "stop", "clean", "status"}:
        setattr(mixin, f"{stage}_retry_attempts", 0)
        setattr(mixin, f"{stage}_retry_delay", 0)
        setattr(mixin, f"{stage}_retry_timeout", 60)
    return mixin


@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_ingress_for_service"
)
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "send_request"
)
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_simulator_state"
)
def test_initialize_simulator(
    mock_get_simulator_state: MagicMock,
    mock_send_request: MagicMock,
    mock_get_ingress_for_service:  MagicMock,
    sim_mixin: SimulatorMixin
) -> None:
    mock_get_simulator_state.side_effect = [
        "UNINITIALIZED",
        "INITIALIZING",
        "INITIALIZED"
    ]
    mock_send_request.return_value = None
    mock_get_ingress_for_service.return_value = "https://dummy.url:1234/test"
    sim_mixin.stages_to_run = {"init"}
    sim_mixin.initialize_simulator()


@pytest.mark.parametrize("current", ["INITIALIZED", "STOPPED"])
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_ingress_for_service"
)
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "send_request"
)
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_simulator_state"
)
def test_start_simulator(
    mock_get_simulator_state: MagicMock,
    mock_send_request: MagicMock,
    mock_get_ingress_for_service:  MagicMock,
    current: str,
    sim_mixin: SimulatorMixin
) -> None:
    mock_get_simulator_state.side_effect = [current, "STARTED"]
    mock_send_request.return_value = None
    mock_get_ingress_for_service.return_value = "https://dummy.url:1234/test"
    sim_mixin.stages_to_run = {"start"}
    sim_mixin.start_simulator()


@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_ingress_for_service"
)
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "send_request"
)
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_simulator_state"
)
def test_stop_simulator(
    mock_get_simulator_state: MagicMock,
    mock_send_request: MagicMock,
    mock_get_ingress_for_service:  MagicMock,
    sim_mixin: SimulatorMixin
) -> None:
    mock_get_simulator_state.side_effect = ["STARTED", "STOPPED"]
    mock_send_request.return_value = None
    mock_get_ingress_for_service.return_value = "https://dummy.url:1234/test"
    sim_mixin.stages_to_run = {"stop"}
    sim_mixin.stop_simulator()


@pytest.mark.parametrize(
    "current",
    [
        "ERROR",
        "INITIALIZED",
        "STOPPED",
        "UNINITIALIZED"
    ]
)
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_ingress_for_service"
)
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "send_request"
)
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_simulator_state"
)
def test_clean_up_simulator(
    mock_get_simulator_state: MagicMock,
    mock_send_request: MagicMock,
    mock_get_ingress_for_service:  MagicMock,
    current: str,
    sim_mixin: SimulatorMixin
) -> None:
    mock_get_simulator_state.side_effect = [
        current,
        "UNINITIALIZING",
        "UNINITIALIZED"
    ]
    mock_send_request.return_value = None
    mock_get_ingress_for_service.return_value = "https://dummy.url:1234/test"
    sim_mixin.stages_to_run = {"clean"}
    sim_mixin.clean_up_simulator()


@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_simulator_state"
)
def test_check_simulator_status(
    mock_get_simulator_state: MagicMock,
    sim_mixin: SimulatorMixin,
    capsys: pytest.CaptureFixture
) -> None:
    mock_get_simulator_state.return_value = "TESTING"
    sim_mixin.stages_to_run = {"status"}
    sim_mixin.check_simulator_status()
    captured = capsys.readouterr()
    assert "The simulator is currently in the 'TESTING' state." in captured.out


@pytest.mark.parametrize("url", ["https://dummy.url:1234/endpoint", ""])
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_ingress_for_service"
)
def test_simulator_url(
    mock_get_ingress_for_service: MagicMock,
    url: str,
    sim_mixin: SimulatorMixin
) -> None:
    mock_get_ingress_for_service.return_value = url
    sim_mixin.instance_name = "instance"
    if url:
        assert sim_mixin.simulator_url == url
    else:
        with pytest.raises(RuntimeError):
            sim_mixin.simulator_url


@pytest.mark.parametrize("current", ["ONE", "INVALID"])
@pytest.mark.parametrize("desired", ["ONE", ["ONE", "TWO"]])
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_simulator_state"
)
def test_ensure_simulator_state(
    mock_get_simulator_state: MagicMock,
    desired: str | list[str],
    current: str,
    sim_mixin: SimulatorMixin,
    capsys: pytest.CaptureFixture
) -> None:
    mock_get_simulator_state.return_value = current
    if current == "INVALID":
        with pytest.raises(RuntimeError):
            sim_mixin.ensure_simulator_state(desired)
    else:
        sim_mixin.ensure_simulator_state(desired)
    captured = capsys.readouterr()
    if isinstance(desired, str):
        assert "Ensuring the simulator is in the 'ONE' state." in captured.out
    else:
        assert (
            "Ensuring the simulator is in one of the following states:  "
            "['ONE', 'TWO']"
        ) in captured.out


def test_ensure_simulator_state_dry_run(
    sim_mixin: SimulatorMixin,
    capsys: pytest.CaptureFixture
) -> None:
    sim_mixin.dry_run = True
    sim_mixin.ensure_simulator_state("DRY-RUN")
    captured = capsys.readouterr()
    assert "Assuming the simulator is in the correct state." in captured.out


def test_http(sim_mixin: SimulatorMixin) -> None:
    retry_strategy = sim_mixin.http.adapters["https://"].max_retries
    assert retry_strategy.allowed_methods == ["POST", "GET"]
    assert retry_strategy.backoff_factor == 0.1
    assert retry_strategy.status_forcelist == [404, 502, 503]
    assert retry_strategy.total == 10


@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_ingress_for_service"
)
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "send_request"
)
def test_get_simulator_state(
    mock_send_request: MagicMock,
    mock_get_ingress_for_service: MagicMock,
    sim_mixin: SimulatorMixin
) -> None:
    response = Response()
    response._content = b'"STATE"'
    mock_send_request.return_value = response
    mock_get_ingress_for_service.return_value = "https://dummy.url:1234/test"
    assert sim_mixin.get_simulator_state() == "STATE"


def test_get_simulator_state_dry_run(sim_mixin: SimulatorMixin) -> None:
    sim_mixin.dry_run = True
    assert sim_mixin.get_simulator_state() == ""


@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_simulator_state"
)
def test_wait_for_simulator_state(
    mock_get_simulator_state: MagicMock,
    sim_mixin: SimulatorMixin
) -> None:
    mock_get_simulator_state.side_effect = ["ONE", "TWO"]
    sim_mixin.state_timeout = 1
    start_time = time()
    sim_mixin.wait_for_simulator_state("TWO")
    assert time() - start_time > 1


@pytest.mark.parametrize("current", ["INVALID", "ERROR"])
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "get_simulator_state"
)
def test_wait_for_simulator_state_raises(
    mock_get_simulator_state: MagicMock,
    current: str,
    sim_mixin: SimulatorMixin
) -> None:
    mock_get_simulator_state.return_value = current
    sim_mixin.state_timeout = 1 / 60
    with pytest.raises(RuntimeError):
        sim_mixin.wait_for_simulator_state("STATE")


def test_wait_for_simulator_state_dry_run(
    sim_mixin: SimulatorMixin,
    capsys: pytest.CaptureFixture
) -> None:
    sim_mixin.dry_run = True
    start_time = time()
    sim_mixin.wait_for_simulator_state("DRY-RUN")
    captured = capsys.readouterr()
    assert "Assuming the simulator is in the correct state." in captured.out
    assert time() - start_time < 1


@pytest.mark.parametrize("status_code", [200, 404])
@pytest.mark.parametrize("save_command", [True, False])
@pytest.mark.parametrize("method", ["GET", "POST"])
@patch(
    "python.simulator_mixin.simulator_mixin.simulator_mixin.SimulatorMixin."
    "generate_curl_command"
)
@patch("requests.Session.post")
@patch("requests.Session.get")
def test_send_request(
    mock_get: MagicMock,
    mock_post: MagicMock,
    mock_generate_curl_command: MagicMock,
    method: str,
    save_command: bool,
    status_code: int,
    sim_mixin: SimulatorMixin
) -> None:
    response = Response()
    response._content = b'"STATE"'
    response.status_code = status_code
    if method == "GET":
        mock_get.return_value = response
    else:
        mock_post.return_value = response
    mock_generate_curl_command.return_value = "curl --foo bar"
    if status_code == 200:
        result = sim_mixin.send_request(
            "url",
            method=method,
            save_command=save_command
        )
        assert result == response
        if save_command:
            assert "curl --foo bar" in sim_mixin.commands_executed
    elif status_code == 404:
        with pytest.raises(HTTPError):
            sim_mixin.send_request(
                "url",
                method=method,
                save_command=save_command
            )


def test_send_request_dry_run(
    sim_mixin: SimulatorMixin,
    capsys: pytest.CaptureFixture
) -> None:
    sim_mixin.console.width = 120
    sim_mixin.dry_run = True
    assert (
        sim_mixin.send_request("https://dry-run.dummy.url", method="GET") is
        None
    )
    captured = capsys.readouterr()
    assert (
        "Skipping sending a 'GET' request to 'https://dry-run.dummy.url'."
    ) in captured.out


@pytest.mark.parametrize(
    "json",
    [
        "",
        "string",
        {
            "one": "two",
            "three": "four"
        }
    ]
)
def test_generate_curl_command(
    json: str | dict[str, str],
    sim_mixin: SimulatorMixin
) -> None:
    url = "https://dummy.url:1234/test"
    response = Response()
    request = Request(method="POST", url=url, json=json).prepare()
    request.prepare(method="POST", url=url, json=json)
    response.request = request
    if json == "":
        data = r"\'\"\"\'"
        content_length = 2
    elif json == "string":
        data = "'string'"
        content_length = 8
    else:
        data = """'{"one": "two", "three": "four"}'"""
        content_length = 31
    assert sim_mixin.generate_curl_command(response) == (
        f"curl --request POST --header 'Content-Length: {content_length}' "
        f"--header 'Content-Type: application/json' --data {data} {url}"
    )


@pytest.mark.parametrize(
    "stdout",
    [
        b"",
        b"""
# bunch
# of
# comments

https://dummy.url:1234/test
""".strip()
    ]
)
def test_get_ingress_for_service(
    stdout: str,
    sim_mixin: SimulatorMixin
) -> None:
    sim_mixin.instance_name = "instance"
    sim_mixin.run = lambda command, **kwargs: CompletedProcess(
        args="",
        returncode=0,
        stdout=stdout
    )
    ingress = sim_mixin.get_ingress_for_service("test")
    if stdout:
        assert ingress == "https://dummy.url:1234/test"
    else:
        assert ingress == ""


def test_get_ingress_for_service_dry_run(
    sim_mixin: SimulatorMixin,
    capsys: pytest.CaptureFixture
) -> None:
    sim_mixin.dry_run = True
    ingress = sim_mixin.get_ingress_for_service("foo")
    assert ingress == "https://dry-run.dummy.url/foo"
