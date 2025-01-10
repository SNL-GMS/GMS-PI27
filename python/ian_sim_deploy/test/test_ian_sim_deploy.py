#!/usr/bin/env python3
import shlex
from argparse import ArgumentTypeError
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from rich.console import Console

from python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy import IANSimDeploy
from python.kubectl.kubectl.kubectl import KubeCtl


@pytest.fixture()
def isd() -> IANSimDeploy:
    ian_sim_deploy = IANSimDeploy({
        "install",
        "wait",
        "init",
        "start",
        "stop",
        "clean",
        "status",
        "uninstall"
    })
    ian_sim_deploy.console = Console(log_time=False, log_path=False)
    return ian_sim_deploy


@pytest.mark.parametrize("save_logs", [True, False])
@pytest.mark.parametrize(
    "stage",
    [
        "install",
        "wait",
        "init",
        "start",
        "stop",
        "clean",
        "status",
        "uninstall"
    ]
)
@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "print_script_execution_summary"
)
@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "save_container_logs"
)
@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "uninstall_instance"
)
@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "check_simulator_status"
)
@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "clean_up_simulator"
)
@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "stop_simulator"
)
@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "start_simulator"
)
@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "initialize_simulator"
)
@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "wait_for_all_pods_ready"
)
@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "install_instance"
)
def test_main(
    mock_install_instance: MagicMock,
    mock_wait_for_all_pods_ready: MagicMock,
    mock_initialize_simulator: MagicMock,
    mock_start_simulator: MagicMock,
    mock_stop_simulator: MagicMock,
    mock_clean_up_simulator: MagicMock,
    mock_check_simulator_status: MagicMock,
    mock_uninstall_instance: MagicMock,
    mock_save_container_logs: MagicMock,
    mock_print_script_execution_summary: MagicMock,
    stage: str,
    save_logs: bool,
    isd: IANSimDeploy
) -> None:
    mock_install_instance.return_value = None
    mock_wait_for_all_pods_ready.return_value = None
    mock_initialize_simulator.return_value = None
    mock_start_simulator.return_value = None
    mock_stop_simulator.return_value = None
    mock_clean_up_simulator.return_value = None
    mock_check_simulator_status.return_value = None
    mock_uninstall_instance.return_value = None
    mock_save_container_logs.return_value = None
    mock_print_script_execution_summary.return_value = None
    args = f"--instance instance --stage {stage}"
    if stage == "install":
        args += " --tag test"
    if save_logs:
        args += " --save-logs"
    isd.main(shlex.split(args))
    if stage == "install":
        mock_install_instance.assert_called_once()
    else:
        mock_install_instance.assert_not_called()
    if stage == "wait":
        mock_wait_for_all_pods_ready.assert_called_once()
    else:
        mock_wait_for_all_pods_ready.assert_not_called()
    if stage == "init":
        mock_initialize_simulator.assert_called_once()
    else:
        mock_initialize_simulator.assert_not_called()
    if stage == "start":
        mock_start_simulator.assert_called_once()
    else:
        mock_start_simulator.assert_not_called()
    if stage == "stop":
        mock_stop_simulator.assert_called_once()
    else:
        mock_stop_simulator.assert_not_called()
    if stage == "clean":
        mock_clean_up_simulator.assert_called_once()
    else:
        mock_clean_up_simulator.assert_not_called()
    if stage == "status":
        mock_check_simulator_status.assert_called_once()
    else:
        mock_check_simulator_status.assert_not_called()
    if stage == "uninstall":
        mock_uninstall_instance.assert_called_once()
    else:
        mock_uninstall_instance.assert_not_called()
    if save_logs:
        mock_save_container_logs.assert_called_once()
    else:
        mock_save_container_logs.assert_not_called()
    mock_print_script_execution_summary.assert_called_once()


def test_parser(isd: IANSimDeploy) -> None:
    for _ in [
        "--stage",
        "--dry-run",
        "--instance",
        "--wait-timeout",
        "--keycloak",
        "--no-keycloak",
        "--node-env",
        "--state-timeout",
        "--install-retry-attempts",
        "--install-retry-delay",
        "--install-retry-timeout",
        "--istio",
        "--no-istio",
        "--set",
        "--set-string",
        "--tag",
        "--timeout",
        "--values",
        "--seed-start-time",
        "--seed-end-time",
        "--sim-start-time",
        "--op-time-period",
        "--calib-update-freq",
    ]:
        assert _ in isd.parser.format_help()


def test_datetime_type() -> None:
    good = "2023-01-23T16:56:07Z"
    bad = "1/23/2023 4:56:07 PM"
    assert IANSimDeploy.datetime_type(good) == good
    with pytest.raises(ArgumentTypeError):
        IANSimDeploy.datetime_type(bad)


def test_parse_args_defaults(isd: IANSimDeploy) -> None:
    isd.parse_args(shlex.split("--instance test --tag develop"))
    assert isd.calib_update_freq == "PT6H"
    assert isd.config_override_path is None
    assert not isd.dry_run
    assert isd.instance_name == "test"
    assert isd.instance_tag == "develop"
    assert isd.istio
    assert isd.keycloak
    assert isd.node_env == "production"
    assert isd.op_time_period == "PT24H"
    assert isd.seed_end_time == "2019-01-05T22:00:00Z"
    assert isd.seed_start_time == "2019-01-05T16:00:00Z"
    assert isd.set_strings is None
    assert isd.sets is None
    assert isd.sim_start_time is not None
    assert isd.stages_to_run == {"install", "wait", "init", "start"}
    assert isd.state_timeout == 5
    assert isd.gmskube_timeout == 15
    assert isd.values is None
    assert isd.wait_timeout == 900


def test_parse_args(isd: IANSimDeploy) -> None:
    isd.parse_args(
        shlex.split(
            "--calib-update-freq PT1H "
            "--dry-run "
            "--instance test "
            "--no-istio "
            "--no-keycloak "
            "--node-env development "
            "--op-time-period PT36H "
            "--seed-end-time 2020-03-04T19:16:17Z "
            "--seed-start-time 2020-03-04T15:16:17Z "
            "--set-string FOO_STRING=bar "
            "--set-string BAZ_STRING=bif "
            "--set FOO=bar "
            "--set BAZ=bif "
            "--sim-start-time 2023-02-14T01:23:46Z "
            "--stage init start stop clean status "
            "--state-timeout 1 "
            "--timeout 5 "
            "--values foo.yaml "
            "--values bar.yaml "
            "--wait-timeout 600 "
        )
    )
    assert isd.calib_update_freq == "PT1H"
    assert isd.config_override_path is None
    assert isd.dry_run
    assert isd.instance_name == "test"
    assert isd.instance_tag is None
    assert not isd.istio
    assert not isd.keycloak
    assert isd.node_env == "development"
    assert isd.op_time_period == "PT36H"
    assert isd.seed_end_time == "2020-03-04T19:16:17Z"
    assert isd.seed_start_time == "2020-03-04T15:16:17Z"
    assert isd.set_strings == ["FOO_STRING=bar", "BAZ_STRING=bif"]
    assert isd.sets == ["FOO=bar", "BAZ=bif"]
    assert isd.sim_start_time == "2023-02-14T01:23:46Z"
    assert isd.stages_to_run == {"init", "start", "stop", "clean", "status"}
    assert isd.state_timeout == 1
    assert isd.gmskube_timeout == 5
    assert isd.values == ["foo.yaml", "bar.yaml"]
    assert isd.wait_timeout == 600


def test_parse_args_raises(isd: IANSimDeploy) -> None:
    with pytest.raises(SystemExit):
        isd.parse_args([])
    with pytest.raises(SystemExit):
        isd.parse_args(shlex.split("--instance instance"))


@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "get_gmskube_install_args"
)
def test_create_install_commands(
    mock_get_gmskube_install_args: MagicMock,
    isd: IANSimDeploy
) -> None:
    mock_get_gmskube_install_args.return_value = ["--foo", "--bar", "--baz"]
    isd.instance_name = "instance"
    assert isd.create_install_commands() == [
        "gmskube install --foo --bar --baz instance"
    ]


@pytest.mark.parametrize("config_override_path", [None, "file.yaml"])
@pytest.mark.parametrize("values", [None, ["foo.yaml", "bar.yaml"]])
@pytest.mark.parametrize(
    "set_strings",
    [None,
     ["FOO=bar",
      "BIF=echo hello world"]]
)
@pytest.mark.parametrize("sets", [None, ["FOO=bar", "BIF=echo hello world"]])
@pytest.mark.parametrize("keycloak", [True, False])
@pytest.mark.parametrize("istio", [True, False])
def test_get_gmskube_install_args(
    config_override_path: str | None,
    istio: bool,
    keycloak: bool,
    sets: list[str] | None,
    set_strings: list[str] | None,
    values: list[str] | None,
    isd: IANSimDeploy
) -> None:
    isd.config_override_path = config_override_path
    isd.node_env = "node_env"
    isd.instance_tag = "tag"
    isd.gmskube_timeout = 42
    isd.istio = istio
    isd.keycloak = keycloak
    isd.sets = sets
    isd.set_strings = set_strings
    isd.values = values
    args = isd.get_gmskube_install_args()
    expected = [
        "--augment bridged-data-source-simulator",
        "--augment oracle",
        "--istio" if istio else "--no-istio",
        "--set interactive-analysis-ui.env.NODE_ENV=node_env",
        "--tag tag",
        "--timeout 42",
        "--type ian",
        f"--values {Path(__file__).resolve().parents[3]}/deploy/custom-values/"
        "ORG/simulator.yaml",
    ]
    if not keycloak:
        expected.append(
            "--set interactive-analysis-ui.env.GMS_DISABLE_KEYCLOAK_AUTH=true"
        )
    if sets is not None:
        expected += ["--set FOO=bar", "--set 'BIF=echo hello world'"]
    if set_strings is not None:
        expected += [
            "--set-string FOO=bar",
            "--set-string 'BIF=echo hello world'"
        ]
    if config_override_path is not None:
        expected += [
            "--config file.yaml"
        ]
    expected.extend(f"--values {_}" for _ in values or [])
    for _ in expected:
        assert _ in args


@pytest.mark.parametrize("extra_sections", [None, {"foo": "bar"}])
@pytest.mark.parametrize("instance_exists", [True, False])
@patch(
    "python.ian_sim_deploy.ian_sim_deploy.ian_sim_deploy.IANSimDeploy."
    "get_ingress_for_service"
)
def test_print_script_execution_summary(
    mock_get_ingress_for_service: MagicMock,
    instance_exists: bool,
    extra_sections: dict[str,
                         str] | None,
    isd: IANSimDeploy,
    capsys: pytest.CaptureFixture
) -> None:
    url = "https://dummy.url:1234/test"
    mock_get_ingress_for_service.return_value = url
    isd.instance_exists = instance_exists
    isd.kubectl = KubeCtl()
    isd.print_script_execution_summary(extra_sections=extra_sections)
    captured = capsys.readouterr()
    if instance_exists:
        assert "UI URL" in captured.out
        assert url in captured.out
    else:
        assert "UI URL" not in captured.out
        assert url not in captured.out
    if extra_sections is not None:
        assert "foo:" in captured.out
        assert "bar" in captured.out


@pytest.mark.parametrize("install", [True, False])
@pytest.mark.parametrize("instance_exists", [True, False])
def test__run_post_stage_actions_install(
    instance_exists: bool,
    install: bool,
    isd: IANSimDeploy
) -> None:
    isd.instance_exists = instance_exists
    isd.stages = {"install", "one", "two", "three"}
    stages_to_run = {"one", "three"}
    if install:
        stages_to_run.add("install")
    isd.stages_to_run = stages_to_run
    isd._run_post_stage_actions_install()
    if not instance_exists and install:
        assert isd.stages_to_run == {"install"}
    else:
        assert isd.stages_to_run == stages_to_run


@pytest.mark.parametrize("pods_ready", [True, False])
def test__run_post_stage_actions_wait(
    pods_ready: bool,
    isd: IANSimDeploy
) -> None:
    isd.instance_exists = True
    isd.stages = {"install", "wait", "one", "two", "three"}
    isd.pods_ready = pods_ready
    stages_to_run = {"install", "wait", "one", "three"}
    isd.stages_to_run = stages_to_run
    isd._run_post_stage_actions_wait()
    if pods_ready:
        assert isd.stages_to_run == stages_to_run
    else:
        assert isd.stages_to_run == {"install", "wait"}
