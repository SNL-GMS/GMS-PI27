#!/usr/bin/env python3
import shlex
from datetime import timedelta
from pathlib import Path
from subprocess import CompletedProcess
from time import sleep
from unittest.mock import MagicMock, patch

import pytest
from rich.console import Console
from tenacity import Future, RetryError

from python.driver_script.driver_script.driver_script import StageDuration
from python.gmskube_wrapper.gmskube_wrapper.gmskube_wrapper import (
    GMSKubeWrapper
)
from python.kubectl.kubectl.kubectl import KubeCtl


@pytest.fixture()
def gw() -> GMSKubeWrapper:
    gmskube_wrapper = GMSKubeWrapper({"install", "wait", "uninstall"})
    gmskube_wrapper.console = Console(log_time=False, log_path=False)
    return gmskube_wrapper


@pytest.mark.parametrize("wait_timeout", [None, 120])
@pytest.mark.parametrize("save_logs", [True, False])
@pytest.mark.parametrize("log_dir", [None, "fake/log/dir"])
def test_parse_args(
    log_dir: str | None,
    save_logs: bool,
    wait_timeout: int,
    gw: GMSKubeWrapper
) -> None:
    args = "--instance instance --tag tag"
    if log_dir is not None:
        args += f" --log-dir {log_dir}"
    if save_logs:
        args += " --save-logs"
    if wait_timeout is not None:
        args += f" --wait-timeout {wait_timeout}"
    if not save_logs and log_dir is not None:
        with pytest.raises(SystemExit):
            gw.parse_args(shlex.split(args))
    else:
        gw.parse_args(shlex.split(args))
    assert gw.instance_name == "instance"
    assert gw.instance_tag == "tag"
    if log_dir is None:
        assert gw.log_dir is None
    else:
        assert gw.log_dir == Path(log_dir)
    assert gw.save_logs == save_logs
    assert gw.wait_timeout == 60 if wait_timeout is None else 120


def test_parse_args_raises(gw: GMSKubeWrapper) -> None:
    with pytest.raises(SystemExit):
        gw.parse_args(
            shlex.split(
                "--stage install --instance instance --log-dir test "
                "--no-save-logs"
            )
        )


def test_install_instance(
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    gw.parse_args(
        shlex
        .split("--dry-run --instance instance --stage install --tag sha1")
    )
    gw.install_instance()
    captured = capsys.readouterr()
    assert "You must override" in captured.out


def test_install_instance_skip_stage(
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    gw.parse_args(shlex.split("--instance dummy --stage wait"))
    gw.install_instance()
    captured = capsys.readouterr()
    assert "install" in [_.stage for _ in gw.durations]
    assert "Skipping this stage." in captured.out
    assert gw.durations[-1].duration < timedelta(seconds=1)


@patch("subprocess.run")
def test_install_instance_retry(
    mock_run: MagicMock,
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run.return_value = CompletedProcess(args="", returncode=1)
    gw.parse_args(
        shlex.split(
            "--instance instance --stage install --tag sha1 "
            "--install-retry-attempts 1"
        )
    )
    gw.install_instance()
    captured = capsys.readouterr()
    assert "Abandoning retrying" in captured.out


@pytest.mark.parametrize("dry_run", [True, False])
@patch("python.kubectl.kubectl.kubectl.KubeCtl.wait_for_all_pods_ready")
def test_wait_for_all_pods_ready_success(
    mock_wait_for_all_pods_ready: MagicMock,
    dry_run: bool,
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    mock_wait_for_all_pods_ready.return_value = None
    gw.parse_args(shlex.split("--stage wait --instance test"))
    gw.dry_run = dry_run
    gw.kubectl = KubeCtl("namespace")
    gw.instance_exists = True
    gw.wait_for_all_pods_ready()
    captured = capsys.readouterr()
    if dry_run:
        assert "Skipping this step." in captured.out
    else:
        assert "All pods are ready." in captured.out
    assert gw.pods_ready


@pytest.mark.parametrize("error", [RetryError(Future(1)), RuntimeError])
@patch("python.kubectl.kubectl.kubectl.KubeCtl.wait_for_all_pods_ready")
def test_wait_for_all_pods_ready_failed(
    mock_wait_for_all_pods_ready: MagicMock,
    error: Exception,
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    mock_wait_for_all_pods_ready.side_effect = error
    gw.parse_args(shlex.split("--stage wait --instance test"))
    gw.kubectl = KubeCtl("namespace")
    gw.instance_exists = True
    gw.wait_for_all_pods_ready()
    captured = capsys.readouterr()
    if isinstance(error, RetryError):
        assert "Not all pods are ready." in captured.out
    assert not gw.pods_ready


def test_uninstall_instance(
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    instance_name = "instance"
    command = f"gmskube uninstall {instance_name}"
    gw.parse_args(
        shlex.split(f"--stage uninstall --instance {instance_name} --dry-run")
    )
    gw.uninstall_instance()
    captured = capsys.readouterr()
    assert command in captured.out


@patch("subprocess.run")
def test_ensure_instance_exists(
    mock_run: MagicMock,
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run.return_value = CompletedProcess(args="", returncode=0)
    gw.instance_name = "test"
    gw.ensure_instance_exists()
    captured = capsys.readouterr()
    assert "Ensuring the 'test' instance exists." in captured.out


def test_ensure_instance_exists_already(
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    gw.instance_name = "test"
    gw.instance_exists = True
    gw.ensure_instance_exists()
    captured = capsys.readouterr()
    assert "Ensuring the 'test' instance exists." not in captured.out


@patch("subprocess.run")
def test_ensure_instance_exists_raises(
    mock_run: MagicMock,
    gw: GMSKubeWrapper
) -> None:
    mock_run.return_value = CompletedProcess(args="", returncode=1)
    gw.instance_name = "test"
    with pytest.raises(RuntimeError):
        gw.ensure_instance_exists()


def test_create_install_commands(gw: GMSKubeWrapper) -> None:
    assert "You must override" in gw.create_install_commands()[0]


@pytest.mark.parametrize("pending", [True, False])
@pytest.mark.parametrize("force_table", [True, False])
@pytest.mark.parametrize("ci", [True, False])
@patch("os.getenv")
@patch("subprocess.run")
def test_get_pod_info(
    mock_run: MagicMock,
    mock_getenv: MagicMock,
    ci: bool,
    force_table: bool,
    pending: bool,
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    pod_table = f"""
NAME         READY   STATUS      RESTARTS   AGE
first-pod    0/1     Completed   0          10h
second-pod   1/2     Running     0          10h
third-pod    0/2     {'Pending' if pending else 'Running'}     0          10h
fourth-pod   2/2     Running     0          10h
""".strip()
    mock_run.return_value = CompletedProcess(
        args="",
        returncode=0,
        stdout=pod_table
    )
    mock_getenv.return_value = "true" if ci else ""
    gw.kubectl = KubeCtl()
    gw.instance_name = "test"
    gw.console.print(gw.get_pod_info(force_table=force_table))
    captured = capsys.readouterr()
    if not ci or force_table:
        for line in pod_table.splitlines():
            assert line in captured.out
    elif pending:
        assert "Waiting for pod:  third-pod" in captured.out
    else:
        assert "Waiting for pod:  second-pod" in captured.out


def test_make_unique_dir(gw: GMSKubeWrapper) -> None:
    reports_dirs = [gw.make_unique_dir("testing") for _ in range(5)]
    for reports_dir in reports_dirs:
        assert reports_dir.name.startswith("testing")
        assert reports_dir.exists()
        reports_dir.rmdir()
    assert len(reports_dirs) == len(set(reports_dirs))


@pytest.mark.parametrize("ci", [True, False])
@patch("os.getenv")
def test_get_log_file_info(
    mock_getenv: MagicMock,
    ci: bool,
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture,
    tmp_path: Path
) -> None:
    gw.log_dir = tmp_path
    files = ["one", "two", "three", "four", "five"]
    for file_name in files:
        (gw.log_dir / file_name).touch()
        sleep(0.1)
    mock_getenv.return_value = "true" if ci else ""
    gw.console.print(gw.get_log_file_info())
    captured = capsys.readouterr()
    if ci:
        assert "Saving logs:  five" in captured.out
    else:
        for file_name in files:
            assert file_name in captured.out


@patch("python.kubectl.kubectl.kubectl.KubeCtl.save_logs")
def test_log_saver(
    mock_save_logs: MagicMock,
    gw: GMSKubeWrapper,
    tmp_path: Path
) -> None:
    mock_save_logs.return_value = None
    gw.kubectl = KubeCtl()
    gw.log_dir = tmp_path
    gw.log_saver()
    assert gw.logs_saved


@patch("pathlib.Path.mkdir")
def test_ensure_log_dir_exists(
    mock_mkdir: MagicMock,
    gw: GMSKubeWrapper,
    tmp_path: Path
) -> None:
    mock_mkdir.return_value = None
    gw.log_dir = None
    gw.ensure_log_dir_exists()
    assert gw.log_dir.name.startswith("__main__-container-logs-")
    gw.log_dir = tmp_path
    gw.log_dir.rmdir
    gw.ensure_log_dir_exists()
    assert gw.log_dir.exists()


@patch("python.kubectl.kubectl.kubectl.KubeCtl.save_logs")
@patch(
    "python.gmskube_wrapper.gmskube_wrapper.gmskube_wrapper.GMSKubeWrapper."
    "get_log_file_info"
)
def test_save_container_logs(
    mock_get_log_file_info: MagicMock,
    mock_save_logs: MagicMock,
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture,
    tmp_path: Path
) -> None:
    mock_get_log_file_info.return_value = "dummy log files"
    mock_save_logs.side_effect = lambda log_dir: sleep(2)
    gw.kubectl = KubeCtl()
    gw.log_dir = tmp_path
    gw.save_container_logs()
    captured = capsys.readouterr()
    assert "dummy log files" in captured.out


@pytest.mark.parametrize("logs_saved", [True, False])
@pytest.mark.parametrize(
    "extras",
    [
        {
            "More information": "Additional details.",
            "Another section": "With still more information."
        },
        None
    ]
)
@patch("subprocess.run")
@patch(
    "reverse_argparse.ReverseArgumentParser."
    "get_pretty_command_line_invocation"
)
def test_print_script_execution_summary(
    mock_get_pretty_command_line_invocation: MagicMock,
    mock_run: MagicMock,
    extras: dict[str,
                 str] | None,
    logs_saved: bool,
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    mock_get_pretty_command_line_invocation.return_value = (
        "command line invocation"
    )
    mock_run.return_value = CompletedProcess(
        args="",
        returncode=0,
        stdout="my-cluster"
    )
    gw.durations = [
        StageDuration(
            "first",
            timedelta(hours=1, minutes=2, seconds=3, microseconds=4)
        ),
        StageDuration(
            "second",
            timedelta(hours=4, minutes=3, seconds=2, microseconds=1)
        )
    ]  # yapf: disable
    gw.commands_executed = ["foo", "bar", "baz"]
    gw.script_success = True
    gw.log_dir = Path("path/to/log/dir")
    gw.logs_saved = logs_saved
    gw.kubectl = KubeCtl()
    if extras is None:
        gw.print_script_execution_summary()
    else:
        gw.print_script_execution_summary(extra_sections=extras)
    captured = capsys.readouterr()
    headings = [
        "Ran the following",
        "Commands executed",
        "Timing results",
        "Script result",
        "Cluster"
    ]
    details = (
        [mock_get_pretty_command_line_invocation.return_value]
        + gw.commands_executed
        + [_.stage for _ in gw.durations]
        + [str(_.duration) for _ in gw.durations]
        + ["Success", "my-cluster"]
    )  # yapf: disable
    if extras is not None:
        headings += list(extras.keys())
        details += list(extras.values())
    if logs_saved:
        headings.append("Container logs")
        details.append("path/to/log/dir")
    for item in headings + details:
        assert item in captured.out


def test__prepare_to_retry_stage_install(
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    gw.dry_run = True
    gw.instance_name = "test"
    gw._prepare_to_retry_stage_install(retry_state=None)
    captured = capsys.readouterr()
    assert "gmskube uninstall test" in captured.out


@pytest.mark.parametrize(
    "instance_exists, stages_to_run, script_success",
    [(True,
      {"uninstall"},
      True),
     (False,
      {"uninstall"},
      True),
     (True,
      {"install",
       "uninstall"},
      True),
     (False,
      {"install",
       "uninstall"},
      False)]
)
def test__run_post_stage_actions_install(
    instance_exists: bool,
    stages_to_run: set,
    script_success: bool,
    gw: GMSKubeWrapper
) -> None:
    gw.instance_exists = instance_exists
    gw.stages_to_run = stages_to_run
    gw._run_post_stage_actions_install()
    assert gw.script_success == script_success
    if not instance_exists and "install" in stages_to_run:
        assert gw.stages_to_run == {"install"}
    else:
        assert gw.stages_to_run == stages_to_run


def test__run_pre_stage_actions_wait(gw: GMSKubeWrapper) -> None:
    gw.instance_name = "test"
    gw.instance_exists = True
    gw._run_pre_stage_actions_wait()
    assert gw.kubectl.namespace == "test"


def test__run_pre_stage_actions_wait_raises(gw: GMSKubeWrapper) -> None:
    gw.instance_name = None
    with pytest.raises(RuntimeError):
        gw._run_pre_stage_actions_wait()


def test__skip_stage_wait(gw: GMSKubeWrapper) -> None:
    gw._skip_stage_wait()
    assert gw.pods_ready


@pytest.mark.parametrize("pods_ready", [True, False])
def test__run_post_stage_actions_wait(
    pods_ready: bool,
    gw: GMSKubeWrapper
) -> None:
    gw.pods_ready = pods_ready
    gw._run_post_stage_actions_wait()
    assert gw.script_success == pods_ready


@pytest.mark.parametrize("save_logs", [True, False])
@patch(
    "python.gmskube_wrapper.gmskube_wrapper.gmskube_wrapper.GMSKubeWrapper."
    "save_container_logs"
)
def test__run_pre_stage_actions_uninstall(
    mock_save_container_logs: MagicMock,
    save_logs: bool,
    gw: GMSKubeWrapper,
    capsys: pytest.CaptureFixture
) -> None:
    dummy_text = "Saving logs"
    mock_save_container_logs.side_effect = lambda: print(dummy_text)
    gw.instance_name = "test"
    gw.instance_exists = True
    gw.save_logs = save_logs
    gw._run_pre_stage_actions_uninstall()
    captured = capsys.readouterr()
    if save_logs:
        assert dummy_text in captured.out
    else:
        assert dummy_text not in captured.out
