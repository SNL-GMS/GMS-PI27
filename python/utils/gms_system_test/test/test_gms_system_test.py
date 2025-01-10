#!/usr/bin/env python3
"""
Unit tests for the ``gms_system_test.py`` script.
"""

import shlex
import shutil
from pathlib import Path
from time import time
from unittest.mock import MagicMock, patch

import pytest
from minio import Minio
from rich.console import Console

from python.kubectl.kubectl.kubectl import KubeCtl
from python.utils.gms_system_test.gms_system_test.gms_system_test import (
    GMSSystemTest
)


@pytest.fixture()
def gst() -> GMSSystemTest:
    gms_system_test = GMSSystemTest({
        "install",
        "wait",
        "init",
        "start",
        "sleep",
        "test",
        "uninstall"
    })
    gms_system_test.console = Console(log_time=False, log_path=False)
    gms_system_test.minio["access_key"] = "MINIO_ACCESS_KEY"
    gms_system_test.minio["secret_key"] = "MINIO_SECRET_KEY"
    return gms_system_test


def test_create_unique_instance_name(gst: GMSSystemTest) -> None:
    names = [gst.create_unique_instance_name() for _ in range(5)]
    for name in names:
        assert name.startswith("gms-system-test-")
    assert len(names) == len(set(names))


minio_command = (
    "gmskube augment apply --tag sha1 --name minio-test-reports --set "
    "minioReportBucket=reports --set minioAccessKey=MINIO_ACCESS_KEY --set "
    "minioSecretKey=MINIO_SECRET_KEY instance"
)
expected_commands = [
    (
        True,
        [
            "gmskube install --augment bridged-data-source-simulator "
            "--augment oracle --istio --set "
            "interactive-analysis-ui.env.GMS_DISABLE_KEYCLOAK_AUTH=true --set "
            "interactive-analysis-ui.env.NODE_ENV=development --tag sha1 "
            "--timeout 15 --type ian --values "
            f"{Path(__file__).resolve().parents[4]}/deploy/custom-values/"
            "ORG/simulator.yaml instance"
        ]
    ),
    (
        False,
        [
            "gmskube install --tag sha1 --type ian --augment oracle "
            "--augment minio-test-reports "
            "--set augmentation.minio-test-reports.minioReportBucket=reports "
            "--set augmentation.minio-test-reports.minioAccessKey=MINIO_ACCESS_KEY "
            "--set augmentation.minio-test-reports.minioSecretKey=MINIO_SECRET_KEY "
            "--set interactive-analysis-ui.env.GMS_DISABLE_KEYCLOAK_AUTH=true "
            "instance"
        ]
    )
]


@pytest.mark.parametrize(
    "simulator, expected",
    expected_commands,
    ids=[_[0] for _ in expected_commands]
)
def test_create_install_commands(
    simulator: bool,
    expected: str,
    gst: GMSSystemTest
) -> None:
    gst.parse_args(
        shlex.split(
            f"--stage install --instance instance --tag sha1 --type ian "
            f"{'' if simulator else '--no-simulator'}"
        )
    )
    gst._run_pre_stage_actions_install()
    result = gst.create_install_commands()
    for a, b in zip(result, expected):
        assert a == b


def test_sleep_after_pods_running(gst: GMSSystemTest) -> None:
    sleep_time = 1
    start_time = time()
    gst.parse_args(shlex.split(f"--stage sleep --sleep {sleep_time}"))
    gst.sleep_after_pods_ready()
    assert time() - start_time > sleep_time


@patch("python.kubectl.kubectl.kubectl.KubeCtl.get_configmap_labels")
def test__run_pre_stage_actions_test(
    mock_get_configmap_labels: MagicMock,
    gst: GMSSystemTest
) -> None:
    gst.kubectl = KubeCtl()
    instance_tag = "foo"
    mock_get_configmap_labels.return_value = {"gms/image-tag": instance_tag}
    gst.parse_args(shlex.split("--stage test --test foo"))
    gst._run_pre_stage_actions_test()
    shutil.rmtree(gst.reports_dir)
    assert gst.instance_tag == instance_tag
    gst.instance_tag = None
    mock_get_configmap_labels.return_value = None
    with pytest.raises(RuntimeError) as e:
        gst._run_pre_stage_actions_test()
    msg = e.value.args[0]
    assert "Unable to determine the instance tag" in msg


def test_apply_test_augmentation(
    gst: GMSSystemTest,
    capsys: pytest.CaptureFixture
) -> None:
    """
    TODO:  UPDATE AFTER AUTO-TAG DETECTION.
    """
    gst.parse_args(
        shlex.split(
            "--stage test --instance instance --tag sha1 --test test-name "
            "--env 'foo=echo hello world' --parallel 3 --dry-run"
        )
    )
    gst.apply_test_augmentation()
    captured = capsys.readouterr()
    expected = (
        "gmskube augment apply --tag sha1 --name test-name --set "
        "env.foo=\"echo hello world\" --set numIdenticalPods=3 instance"
    )
    for word in expected.split():
        assert word in captured.out


@pytest.mark.parametrize("istio_enabled", [True, False])
@patch("python.kubectl.kubectl.kubectl.KubeCtl.get_endpoints")
@patch("python.kubectl.kubectl.kubectl.KubeCtl.get_resource")
@patch("python.kubectl.kubectl.kubectl.KubeCtl.istio_enabled")
def test__get_minio_endpoint(
    mock_istio_enabled: MagicMock,
    mock_get_resource: MagicMock,
    mock_get_endpoints: MagicMock,
    istio_enabled: bool,
    gst: GMSSystemTest
) -> None:
    gst.kubectl = KubeCtl("namespace")
    gst.kubectl_gms = KubeCtl("other-namespace")
    mock_get_endpoints.return_value = "host.name", ["/"]
    mock_get_resource.return_value = [{
        "data": {
            "istio_port": "12345",
            "nginx_port": "54321"
        }
    }]
    mock_istio_enabled.return_value = istio_enabled
    endpoint = gst._get_minio_endpoint()
    if istio_enabled:
        assert endpoint == "host.name:12345/"
    else:
        assert endpoint == "host.name:54321/"


@patch("python.kubectl.kubectl.kubectl.KubeCtl.get_endpoints")
@patch("python.kubectl.kubectl.kubectl.KubeCtl.get_resource")
def test__get_minio_endpoint_raises(
    mock_get_resource: MagicMock,
    mock_get_endpoints: MagicMock,
    gst: GMSSystemTest
) -> None:
    gst.kubectl = KubeCtl("namespace")
    gst.kubectl_gms = KubeCtl("other-namespace")
    mock_get_endpoints.return_value = None, None
    with pytest.raises(RuntimeError) as e:
        gst._get_minio_endpoint()
    msg = e.value.args[0]
    assert "Failed to locate" in msg
    mock_get_endpoints.return_value = "host.name", ["/"]
    mock_get_resource.return_value = []
    with pytest.raises(RuntimeError) as e:
        gst._get_minio_endpoint()
    msg = e.value.args[0]
    assert "Failed to get the port" in msg


@patch(
    "python.utils.gms_system_test.gms_system_test.gms_system_test."
    "GMSSystemTest._get_minio_endpoint"
)
@patch.object(Minio, "__init__", return_value=None)
def test_minio_client(
    mock_Minio: MagicMock,
    mock__get_minio_endpoint: MagicMock
) -> None:
    """
    TODO:  FIGURE OUT HOW TO MOCK ``Minio()``.
    """
    # gst = GMSSystemTest()
    # mock_get_minio_endpoint.return_value = "host.name:12345/"
    # with pytest.raises(RuntimeError) as e:
    #     gst.get_minio_client()
    # msg = e.value.args[0]
    # assert "Failed to connect to MinIO endpoint" in msg
    assert True


def test_extract_minio_object() -> None:
    """
    TODO:  FIGURE OUT HOW TO UNIT TEST THIS.
    """
    assert True


def test_pod_succeeded() -> None:
    """
    TODO:  FIGURE OUT HOW TO UNIT TEST THIS.
    """
    assert True


def test_retrieve_test_results() -> None:
    """
    TODO:  FIGURE OUT HOW TO UNIT TEST THIS.
    """
    assert True


# @pytest.mark.parametrize("tests", ["", "jest"])
# @pytest.mark.parametrize("env", [[""], ["foo=bar"]])
# def test_run_tests(tests, env, capsys):
def test_run_tests() -> None:
    """
    Todo:
        * Update this once :func:`run_test` has been updated for
          dry-run mode.
    """
    assert True
    # gst = GMSSystemTest(
    #     Namespace(
    #         instance="test-instance",
    #         dry_run=True,
    #         tests=tests,
    #         env=env
    #     )
    # )
    # gst.run_test()
    # captured = capsys.readouterr()
    # assert "gms_test_runner.py" in captured.out
    # assert "--force" in captured.out
    # assert "--reports" in captured.out
    # assert gst.instance_name in captured.out
    # if tests:
    #     assert tests in captured.out
    # if env:
    #     for value in env:
    #         assert value in captured.out


@patch("python.kubectl.kubectl.kubectl.KubeCtl.save_logs")
def test_keyboard_interrupt_handler(
    mock_save_logs: MagicMock,
    gst: GMSSystemTest,
    capsys: pytest.CaptureFixture
) -> None:
    instance_name = "instance"
    command = f"gmskube uninstall {instance_name}"
    gst.kubectl = KubeCtl(instance_name)
    gst.parse_args(
        shlex.split(
            f"--tag sha1 --type ian --no-simulator --instance {instance_name} --stage install "
            "wait sleep test uninstall --test TEST-NAME --dry-run"
        )
    )
    with pytest.raises(SystemExit) as exc:
        gst.keyboard_interrupt_handler(signal_number=1, stack_frame=None)
    assert exc.value.code == 1
    captured = capsys.readouterr()
    expected = ["Caught a keyboard interrupt signal", command]
    for line in expected:
        for word in line.split():
            assert word in captured.out


@pytest.mark.parametrize(
    "env_args, parallel, expected",
    [(
        ["FOO=BAR"],
        1,
        ['--set env.FOO="BAR"']
    ), (
        ["spaces=echo hello world"],
        1,
        ['--set env.spaces="echo hello world"']
    ), (
        ["check=multiple", "args=okay"],
        1,
        ['--set env.check="multiple"', '--set env.args="okay"']
    ), (
        ["global=here", "test-name.foo=also here", "other-test.bar=missing"],
        1,
        ['--set env.global="here"', '--set env.foo="also here"']
    ), (
        ["FOO=BAR"],
        3,
        ['--set env.FOO="BAR"', '--set numIdenticalPods=3']
    ), (
        [],
        1,
        []
    )]
)  # yapf: disable
def test_create_set_args(
    env_args: str,
    parallel: int,
    expected: str,
    gst: GMSSystemTest
) -> None:
    gst.test_name = "test-name"
    gst.parallel = parallel
    assert gst.create_set_args(env_args) == expected


def test_parse_args(gst: GMSSystemTest) -> None:
    gst.parse_args(
        shlex.split(
            "--env foo=bar --env baz=bif --tag my-tag --type ian --parallel 5 "
            "--sleep 123 --test MY-TEST --test-retry-attempts 8 "
            "--test-retry-delay 10 --test-retry-timeout 54321 --no-simulator"
        )
    )
    assert gst.parallel == 5
    assert gst.set_args == [
        '--set env.foo="bar"',
        '--set env.baz="bif"',
        '--set numIdenticalPods=5'
    ]
    assert gst.sleep == 123
    assert gst.test_name == "MY-TEST"
    assert gst.test_retry_attempts == 8
    assert gst.test_retry_delay == 10
    assert gst.test_retry_timeout == 54321


def test_parse_args_raises(
    gst: GMSSystemTest,
    capsys: pytest.CaptureFixture
) -> None:
    with pytest.raises(SystemExit):
        gst.parse_args(shlex.split("--stage test"))
    captured = capsys.readouterr()
    for word in "`--test` flag augment catalog":
        assert word in captured.out
