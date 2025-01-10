import io
import os
import re
import shlex
import zipfile
from argparse import ArgumentTypeError, Namespace
from json.decoder import JSONDecodeError
from kubernetes.client.rest import ApiException
from unittest.mock import MagicMock, mock_open, patch, PropertyMock


import pytest
from rich.console import Console

from python.gmskube import GMSKube
from get_test_resources import (
    get_config_overrides_path,
    get_request_response,
    get_test_custom_chart_path,
    get_test_file_contents
)


# Build a complex mock object from a nested dict
# https://dev.to/taqkarim/extending-simplenamespace-for-nested-dictionaries-58e8
class RecursiveNamespace:
    @staticmethod
    def map_entry(entry):
        if isinstance(entry, dict):
            return RecursiveNamespace(**entry)
        return entry

    def __init__(self, **kwargs):
        for key, val in kwargs.items():
            if type(val) is dict:
                setattr(self, key, RecursiveNamespace(**val))
            elif type(val) is list:
                setattr(self, key, list(map(self.map_entry, val)))
            else:
                setattr(self, key, val)


@pytest.fixture()
def gmskube() -> GMSKube:
    gmskube = GMSKube()
    gmskube.console = Console(log_time=False, log_path=False)
    return gmskube


@patch("kubernetes.config.load_kube_config")
@patch("python.gmskube.GMSKube.set_helm_path")
@patch("python.gmskube.GMSKube.kubernetes_context_name", new_callable=PropertyMock)
@patch("pathlib.Path.chmod")
@patch("builtins.open", new_callable=mock_open)
@patch("logging.basicConfig")
@patch("argparse.ArgumentParser.parse_args")
def test_main(
    mock_parse_args: MagicMock,
    mock_basicConfig: MagicMock,
    mock_open: MagicMock,
    mock_chmod: MagicMock,
    mock_kubernetes_context: MagicMock,
    mock_set_helm_path: MagicMock,
    mock_load_kube_config: MagicMock,
    monkeypatch,
    gmskube: GMSKube
) -> None:
    mock_parse_args.return_value = Namespace(
        verbose="DEBUG",
        command=(lambda *args: None)
    )
    mock_basicConfig.return_value = None
    mock_chmod.return_value = None
    mock_kubernetes_context.return_value = "blue"
    mock_set_helm_path.return_value = None
    mock_load_kube_config.return_value = None
    monkeypatch.setenv("KUBECTL_CONTEXT", "test")
    monkeypatch.delenv("REQUEST_CA_BUNDLE", raising=False)
    gmskube.main([])


def test_main_no_command(
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    with pytest.raises(SystemExit):
        gmskube.main([])
    stdout, _ = capsys.readouterr()
    for line in [
        "usage: gmskube [-h]",
        "The `gmskube` command-line program",
        "Before you can run `gmskube`",
    ]:
        assert line in stdout


@pytest.mark.parametrize(
    "name, exception",
    [("Te$t",
      ArgumentTypeError),
     ("",
      SystemExit)]
)
def test_parse_args_name_invalid(
    name: str,
    exception: Exception,
    gmskube: GMSKube
) -> None:
    with pytest.raises(exception):
        gmskube.parse_args(
            shlex.split(f"install --tag develop --type ian {name}")
        )


def test_parse_args_tag_raises(gmskube: GMSKube) -> None:
    with pytest.raises(ArgumentTypeError):
        gmskube.parse_args(
            shlex.split("install --type ian test")
        )


# ----- Uninstall tests
@pytest.mark.parametrize("reuse_namespace", [True, False])
@patch("kubernetes.watch.watch.Watch.stream")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_daemon_set")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_deployment")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_replica_set")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_stateful_set")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_namespaced_persistent_volume_claim")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.delete_namespace")
@patch("python.gmskube.GMSKube.run_helm_uninstall")
def test_uninstall_success(
    mock_run_helm_uninstall: MagicMock,
    mock_delete_namespace: MagicMock,
    mock_list_pvc: MagicMock,
    mock_list_stateful_set: MagicMock,
    mock_list_replica_set: MagicMock,
    mock_list_deployment: MagicMock,
    mock_list_daemon_set: MagicMock,
    mock_watch_stream: MagicMock,
    reuse_namespace: bool,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run_helm_uninstall.return_value = (0, "", "")
    mock_delete_namespace.return_value = None
    mock_list_pvc.return_value = PropertyMock(items=[])
    mock_list_stateful_set.return_value = PropertyMock(items=[])
    mock_list_replica_set.return_value = PropertyMock(items=[])
    mock_list_deployment.return_value = PropertyMock(items=[])
    mock_list_daemon_set.return_value = PropertyMock(items=[])
    mock_watch_stream.return_value = []
    gmskube.parse_args(
        shlex.split(
            "uninstall test --timeout 4 "
            f"{'--reuse-namespace' if reuse_namespace else ''}"
        )
    )
    gmskube.uninstall_instance()
    stdout, _ = capsys.readouterr()
    for line in [
        "Uninstalling test",
        "Running helm uninstall",
        "test uninstall complete",
    ]:
        assert line in stdout
    assert ("Deleting namespace" in stdout) is not reuse_namespace


@patch("kubernetes.watch.watch.Watch.stream")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_daemon_set")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_deployment")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_replica_set")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_stateful_set")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_namespaced_persistent_volume_claim")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.delete_namespace")
@patch("python.gmskube.GMSKube.run_helm_uninstall")
def test_uninstall_helm_uninstall_fail(
    mock_run_helm_uninstall: MagicMock,
    mock_delete_namespace: MagicMock,
    mock_list_pvc: MagicMock,
    mock_list_stateful_set: MagicMock,
    mock_list_replica_set: MagicMock,
    mock_list_deployment: MagicMock,
    mock_list_daemon_set: MagicMock,
    mock_watch_stream: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run_helm_uninstall.return_value = (1, "", "")
    mock_delete_namespace.return_value = None
    mock_list_pvc.return_value = PropertyMock(items=[])
    mock_list_stateful_set.return_value = PropertyMock(items=[])
    mock_list_replica_set.return_value = PropertyMock(items=[])
    mock_list_deployment.return_value = PropertyMock(items=[])
    mock_list_daemon_set.return_value = PropertyMock(items=[])
    mock_watch_stream.return_value = []
    gmskube.parse_args(shlex.split("uninstall test --timeout 4"))
    gmskube.uninstall_instance()
    stdout, _ = capsys.readouterr()
    expected = [
        "Helm uninstall unsuccessful",
        "Deleting namespace",
        "test uninstall complete"
    ]
    for line in expected:
        for word in line.split():
            assert word in stdout


@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_daemon_set")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_deployment")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_replica_set")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_stateful_set")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_namespaced_persistent_volume_claim")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.delete_namespace")
@patch("python.gmskube.GMSKube.run_helm_uninstall")
def test_uninstall_delete_namespace_raises(
    mock_run_helm_uninstall: MagicMock,
    mock_delete_namespace: MagicMock,
    mock_list_pvc: MagicMock,
    mock_list_stateful_set: MagicMock,
    mock_list_replica_set: MagicMock,
    mock_list_deployment: MagicMock,
    mock_list_daemon_set: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run_helm_uninstall.return_value = (0, "", "")
    mock_delete_namespace.side_effect = ApiException('Not Found')
    mock_list_pvc.return_value = PropertyMock(items=[])
    mock_list_stateful_set.return_value = PropertyMock(items=[])
    mock_list_replica_set.return_value = PropertyMock(items=[])
    mock_list_deployment.return_value = PropertyMock(items=[])
    mock_list_daemon_set.return_value = PropertyMock(items=[])
    gmskube.parse_args(shlex.split("uninstall test --timeout 4"))
    gmskube.uninstall_instance()
    stdout, _ = capsys.readouterr()
    expected = (
        "test uninstall unsuccessful, please review errors/warnings above"
    )
    for word in expected.split():
        assert word in stdout
    assert "test uninstall complete" not in stdout


# ----- Cluster init tests
@pytest.mark.parametrize("confirm", [True, False])
@patch("rich.prompt.Confirm.ask")
@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
def test_cluster_init(
    mock_run_helm_install_upgrade: MagicMock,
    mock_ask: MagicMock,
    confirm: bool,
    gmskube: GMSKube
) -> None:
    mock_run_helm_install_upgrade.return_value = (0, "", "")
    mock_ask.return_value = confirm
    gmskube.parse_args(
        shlex.split(
            "cluster init "
            "--tag test "
            "--wallet-path test "
            "--values test "
        )
    )
    if confirm:
        gmskube.cluster_init()
    else:
        with pytest.raises(SystemExit):
            gmskube.cluster_init()


@patch("rich.prompt.Confirm.ask")
@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
def test_cluster_init_helm_install_fail(
    mock_run_helm_install_upgrade: MagicMock,
    mock_ask: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run_helm_install_upgrade.return_value = (1, "", "")
    mock_ask.return_value = True
    gmskube.parse_args(
        shlex.split(
            "cluster init "
            "--tag test "
            "--wallet-path test "
            "--values test "
        )
    )

    with pytest.raises(RuntimeError) as exc_info:
        gmskube.cluster_init()
    stdout, _ = capsys.readouterr()
    assert "Could not initialize the cluster for GMS" in exc_info.value.args[0]
    assert "Cluster initialized for GMS successfully!" not in stdout


# ----- Install tests
@patch("python.gmskube.GMSKube.apply_augmentation")
@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.request_dataload")
@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
@patch("python.gmskube.GMSKube.create_namespace")
def test_install_custom_chart(
    mock_create_namespace: MagicMock,
    mock_run_helm_install_upgrade: MagicMock,
    mock_request_dataload: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    mock_apply_augmentation: MagicMock,
    gmskube: GMSKube
) -> None:
    mock_create_namespace.return_value = None
    mock_run_helm_install_upgrade.return_value = (0, "", "")
    mock_request_dataload.return_value = True
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.local"
    mock_apply_augmentation.return_value = None
    gmskube.parse_args(
        shlex.split(
            "install "
            f"--chart {get_test_custom_chart_path()} "
            "--no-istio "
            "--set name=value "
            "--set-string name=value "
            "--values file "
            "--wallet-path file "
            "--tag test "
            "--timeout 4 "
            "test"
        )
    )
    gmskube.install_instance()


@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.request_dataload")
@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
@patch("python.gmskube.GMSKube.create_namespace")
def test_install_dry_run(
    mock_create_namespace: MagicMock,
    mock_run_helm_install_upgrade: MagicMock,
    mock_request_dataload: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_create_namespace.return_value = None
    mock_run_helm_install_upgrade.return_value = (0, "", "")
    mock_request_dataload.return_value = True
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.local"
    gmskube.parse_args(
        shlex.split(
            "install "
            "--dry-run "
            "--no-istio "
            "--tag test "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    with pytest.raises(SystemExit):
        gmskube.install_instance()
    stdout, _ = capsys.readouterr()
    assert "Setting up namespace test" not in stdout
    assert "test installed successfully" not in stdout


@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.request_dataload")
@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
@patch("python.gmskube.GMSKube.create_namespace")
def test_install_istio(
    mock_create_namespace: MagicMock,
    mock_run_helm_install_upgrade: MagicMock,
    mock_request_dataload: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_create_namespace.return_value = None
    mock_run_helm_install_upgrade.return_value = (0, "", "")
    mock_request_dataload.return_value = True
    mock_ingress_port.return_value = "8443"
    mock_base_domain.return_value = "test.cluster.local"
    gmskube.parse_args(
        shlex.split(
            "install "
            "--istio "
            "--tag test "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    gmskube.install_instance()
    stdout, _ = capsys.readouterr()
    assert "Ingress port: 8443" in stdout


@patch("python.gmskube.GMSKube.apply_augmentation")
@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.request_dataload")
@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
@patch("python.gmskube.GMSKube.create_namespace")
def test_install_with_augmentations(
    mock_create_namespace: MagicMock,
    mock_run_helm_install_upgrade: MagicMock,
    mock_request_dataload: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    mock_apply_augmentation: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_create_namespace.return_value = None
    mock_run_helm_install_upgrade.return_value = (0, "", "")
    mock_request_dataload.return_value = True
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.local"
    mock_apply_augmentation.return_value = None
    gmskube.parse_args(
        shlex.split(
            "install "
            "--augment minio-test-reports "
            "--augment javadoc "
            "--no-istio "
            "--tag test "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    gmskube.install_instance()
    stdout, _ = capsys.readouterr()
    assert "Enabling augmentation minio-test-reports" in stdout
    assert "Enabling augmentation javadoc" in stdout


@patch("python.gmskube.GMSKube.apply_augmentation")
@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.request_dataload")
@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
@patch("python.gmskube.GMSKube.create_namespace")
def test_install_with_augmentations_sets(
    mock_create_namespace: MagicMock,
    mock_run_helm_install_upgrade: MagicMock,
    mock_request_dataload: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    mock_apply_augmentation: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_create_namespace.return_value = None
    mock_run_helm_install_upgrade.return_value = (0, "", "")
    mock_request_dataload.return_value = True
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.local"
    mock_apply_augmentation.return_value = None
    gmskube.parse_args(
        shlex.split(
            "install "
            "--augment minio-test-reports "
            "--augment javadoc "
            "--no-istio "
            "--set name=value "
            "--tag test "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    gmskube.install_instance()
    stdout, _ = capsys.readouterr()
    assert "Enabling augmentation minio-test-reports" in stdout
    assert "Enabling augmentation javadoc" in stdout


@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
@patch("python.gmskube.GMSKube.create_namespace")
def test_install_helm_install_fail(
    mock_create_namespace: MagicMock,
    mock_run_helm_install_upgrade: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_create_namespace.return_value = None
    mock_run_helm_install_upgrade.return_value = (1, "", "")
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.local"
    gmskube.livedata = False
    gmskube.parse_args(
        shlex.split(
            "install "
            "--no-istio "
            "--set name=value "
            "--tag test "
            "--type ian "
            "--timeout 4 "
            "test"
        )
    )
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.install_instance()
    stdout, _ = capsys.readouterr()
    assert "Could not install instance test" in exc_info.value.args[0]
    assert "test installed successfully" not in stdout


# ----- Upgrade tests
@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
@patch("python.gmskube.GMSKube.run_helm_get_values")
@patch("python.gmskube.GMSKube.instance_type", new_callable=PropertyMock)
def test_upgrade_dry_run(
    mock_instance_type: MagicMock,
    mock_run_helm_get_values: MagicMock,
    mock_run_helm_install_upgrade: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_instance_type.return_value = "ian"
    mock_run_helm_get_values.return_value = (
        0,
        get_test_file_contents("cmds/run_helm_get_values.yaml"),
        ""
    )
    mock_run_helm_install_upgrade.return_value = (0, "", "")
    gmskube.parse_args(
        shlex.split(
            "upgrade "
            "--set-string name=value "
            "--values file "
            "--dry-run "
            "--tag test "
            "--timeout 4 "
            "test"
        )
    )
    gmskube.upgrade_instance()
    stdout, _ = capsys.readouterr()
    assert "Upgrading test" in stdout
    assert "Instance type is: ian" in stdout
    assert "Getting existing helm values" in stdout
    assert "Saving existing helm values to a temporary file" in stdout
    assert "Running helm upgrade" in stdout
    assert "test upgrade complete!" in stdout


@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
@patch("python.gmskube.GMSKube.run_helm_get_values")
def test_upgrade_custom_chart(
    mock_run_helm_get_values: MagicMock,
    mock_run_helm_install_upgrade: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run_helm_get_values.return_value = (
        0,
        get_test_file_contents("cmds/run_helm_get_values.yaml"),
        ""
    )
    mock_run_helm_install_upgrade.return_value = (0, "", "")
    gmskube.parse_args(
        shlex.split(
            "upgrade "
            f"--chart {get_test_custom_chart_path()} "
            "--tag test "
            "--timeout 4 "
            "test"
        )
    )
    gmskube.upgrade_instance()
    stdout, _ = capsys.readouterr()
    assert "Instance type is: custom" in stdout


@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
@patch("python.gmskube.GMSKube.run_helm_get_values")
@patch("python.gmskube.GMSKube.instance_type", new_callable=PropertyMock)
def test_upgrade_with_augmentations(
    mock_instance_type: MagicMock,
    mock_run_helm_get_values: MagicMock,
    mock_run_helm_install_upgrade: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_instance_type.return_value = "ian"
    mock_run_helm_get_values.return_value = (
        0,
        get_test_file_contents("cmds/run_helm_get_values.yaml"),
        ""
    )
    mock_run_helm_install_upgrade.return_value = (0, "", "")
    gmskube.parse_args(
        shlex.split(
            "upgrade "
            "--augment minio-test-reports "
            "--augment javadoc "
            "--set name=value "
            "--tag test "
            "--timeout 4 "
            "test"
        )
    )
    gmskube.upgrade_instance()
    stdout, _ = capsys.readouterr()
    assert "Enabling augmentation minio-test-reports" in stdout
    assert "Enabling augmentation javadoc" in stdout


@patch("python.gmskube.GMSKube.run_helm_get_values")
@patch("python.gmskube.GMSKube.instance_type", new_callable=PropertyMock)
def test_upgrade_helm_get_values_fail(
    mock_instance_type: MagicMock,
    mock_run_helm_get_values: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_instance_type.return_value = "ian"
    mock_run_helm_get_values.return_value = (1, "", "helm get values failed")
    gmskube.parse_args(
        shlex.split(
            "upgrade "
            "--set name=value "
            "--tag test "
            "--timeout 4 "
            "test"
        )
    )
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.upgrade_instance()
    expected = (
        "Unable to get existing values for instance test helm get values "
        "failed"
    )
    for word in expected.split():
        assert word in exc_info.value.args[0]


@patch("python.gmskube.GMSKube.run_helm_install_upgrade")
@patch("python.gmskube.GMSKube.run_helm_get_values")
@patch("python.gmskube.GMSKube.instance_type", new_callable=PropertyMock)
def test_upgrade_helm_upgrade_fail(
    mock_instance_type: MagicMock,
    mock_run_helm_get_values: MagicMock,
    mock_run_helm_install_upgrade: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_instance_type.return_value = "ian"
    mock_run_helm_get_values.return_value = (
        0,
        get_test_file_contents("cmds/run_helm_get_values.yaml"),
        ""
    )
    mock_run_helm_install_upgrade.return_value = (1, "", "helm upgrade failed")
    gmskube.parse_args(
        shlex.split(
            "upgrade "
            "--set name=value "
            "--tag test "
            "--timeout 4 "
            "test"
        )
    )
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.upgrade_instance()
    expected = "Could not upgrade instance test helm upgrade failed"
    for word in expected.split():
        assert word in exc_info.value.args[0]


# ----- Reconfig tests
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.patch_namespaced_deployment")
@patch("kubernetes.client.api.apps_v1_api.AppsV1Api.list_namespaced_deployment")
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.is_istio", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.request_dataload")
@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
def test_reconfig(
    mock_base_domain: MagicMock,
    mock_request_dataload: MagicMock,
    mock_is_istio: MagicMock,
    mock_ingress_port: MagicMock,
    mock_list_deployment: MagicMock,
    mock_patch_deployment: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_base_domain.return_value = "test.cluster.local"
    mock_request_dataload.return_value = True
    mock_is_istio.return_value = False
    mock_ingress_port.return_value = "443"
    mock_list_deployment.return_value = RecursiveNamespace(
        **{
            "items": [
                {
                    "metadata": {
                        "name": "test"
                    }
                }
            ]
        }
    )
    mock_patch_deployment.return_value = None
    gmskube.parse_args(
        shlex.split("reconfig "
                    "--config test "
                    "--timeout 4 "
                    "test")
    )
    gmskube.reconfigure_instance()
    stdout, _ = capsys.readouterr()
    expected = [
        "Reconfiguring test",
        "Instance istio status: False",
        "Ingress port: 443",
        "Beginning data load",
        "Rollout restart deployments",
        "Getting list of deployments with label `gms/restartAfterReconfig=true`",
        "Restarting deployment test",
        "test reconfig complete"
    ]
    for line in expected:
        for word in line.split():
            assert word in stdout


def test_reconfig_raises(
    gmskube: GMSKube,
) -> None:
    gmskube.parse_args(
        shlex.split("reconfig "
                    "--timeout 4 "
                    "test")
    )
    with pytest.raises(ArgumentTypeError) as exc_info:
        gmskube.reconfigure_instance()
    expected = "Config override path must be specified with --config"
    for word in expected.split():
        assert word in exc_info.value.args[0]


@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.is_istio", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.request_dataload")
@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
def test_reconfig_dataload_fail(
    mock_base_domain: MagicMock,
    mock_request_dataload: MagicMock,
    mock_is_istio: MagicMock,
    mock_ingress_port: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_base_domain.return_value = "test.cluster.local"
    mock_request_dataload.return_value = False
    mock_is_istio.return_value = False
    mock_ingress_port.return_value = "443"
    gmskube.parse_args(
        shlex.split("reconfig "
                    "--config test "
                    "--timeout 4 "
                    "test")
    )
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.reconfigure_instance()
    expected = "Data load failed to execute successfully, Exiting"
    for word in expected.split():
        assert word in exc_info.value.args[0]


# ----- List tests
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_config_map_for_all_namespaces")
@patch("python.gmskube.GMSKube.run_helm_list")
def test_list(
    mock_run_helm_list: MagicMock,
    mock_list_configmap: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run_helm_list.return_value = (
        0,
        get_test_file_contents("cmds/run_helm_list.json"),
        ""
    )
    mock_list_configmap.return_value = PropertyMock(
        items=[
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "test",
                "gms/user": "testuser",
                "gms/type": "ian",
                "gms/update-time": "2021-12-20T210438Z",
                "gms/image-tag": "develop"
            })),
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "logging",
                "gms/user": "otheruser",
                "gms/type": "logging",
                "gms/update-time": "2021-11-24T013156Z",
                "gms/image-tag": "develop"
            }))
        ]
    )
    gmskube.console.width = 120
    gmskube.show_all = False
    gmskube.parse_args(["ls"])
    gmskube.list_instances()
    stdout, _ = capsys.readouterr()
    assert "fleet-agent-local" not in stdout
    for line in [
        "logging   deployed   logging   otheruser   2021-11-24T013156Z   develop",
        "test      deployed   ian       testuser    2021-12-20T210438Z   develop"
    ]:
        assert line in stdout


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_config_map_for_all_namespaces")
@patch("python.gmskube.GMSKube.run_helm_list")
def test_list_all(
    mock_run_helm_list: MagicMock,
    mock_list_configmap: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run_helm_list.return_value = (
        0,
        get_test_file_contents("cmds/run_helm_list.json"),
        ""
    )
    mock_list_configmap.return_value = PropertyMock(
        items=[
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "test",
                "gms/user": "testuser",
                "gms/type": "ian",
                "gms/update-time": "2021-12-20T210438Z",
                "gms/image-tag": "develop"
            })),
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "logging",
                "gms/user": "otheruser",
                "gms/type": "logging",
                "gms/update-time": "2021-11-24T013156Z",
                "gms/image-tag": "develop"
            }))
        ]
    )
    gmskube.console.width = 120
    gmskube.parse_args(shlex.split("ls --all"))
    gmskube.list_instances()
    stdout, _ = capsys.readouterr()
    for line in [
        "fleet-agent-local        deployed   ?         ?           ?                    ?",
        "logging                  deployed   logging   otheruser   2021-11-24T013156Z   develop",
        "test                     deployed   ian       testuser    2021-12-20T210438Z   develop"
    ]:
        assert line in stdout


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_config_map_for_all_namespaces")
@patch("python.gmskube.GMSKube.run_helm_list")
def test_list_user(
    mock_run_helm_list: MagicMock,
    mock_list_configmap: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run_helm_list.return_value = (
        0,
        get_test_file_contents("cmds/run_helm_list.json"),
        ""
    )
    mock_list_configmap.return_value = PropertyMock(
        items=[
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "test",
                "gms/user": "testuser",
                "gms/type": "ian",
                "gms/update-time": "2021-12-20T210438Z",
                "gms/image-tag": "develop"
            })),
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "logging",
                "gms/user": "otheruser",
                "gms/type": "logging",
                "gms/update-time": "2021-11-24T013156Z",
                "gms/image-tag": "develop"
            }))
        ]
    )
    gmskube.console.width = 120
    gmskube.parse_args(shlex.split("ls --user testuser"))
    gmskube.list_instances()
    stdout, _ = capsys.readouterr()
    for instance_name in ["fleet-agent-local", "logging"]:
        assert instance_name not in stdout
    assert (
        "test   deployed   ian    testuser   2021-12-20T210438Z   develop"
    ) in stdout


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_config_map_for_all_namespaces")
@patch("python.gmskube.GMSKube.run_helm_list")
def test_list_type(
    mock_run_helm_list: MagicMock,
    mock_list_configmap: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run_helm_list.return_value = (
        0,
        get_test_file_contents("cmds/run_helm_list.json"),
        ""
    )
    mock_list_configmap.return_value = PropertyMock(
        items=[
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "test",
                "gms/user": "testuser",
                "gms/type": "ian",
                "gms/update-time": "2021-12-20T210438Z",
                "gms/image-tag": "develop"
            })),
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "logging",
                "gms/user": "otheruser",
                "gms/type": "logging",
                "gms/update-time": "2021-11-24T013156Z",
                "gms/image-tag": "develop"
            }))
        ]
    )
    gmskube.console.width = 120
    gmskube.parse_args(shlex.split("ls --type logging"))
    gmskube.list_instances()
    stdout, _ = capsys.readouterr()
    for instance_name in ["fleet-agent-local", "grafana"]:
        assert instance_name not in stdout
    assert (
        "logging   deployed   logging   otheruser   2021-11-24T013156Z   develop"
    ) in stdout


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_config_map_for_all_namespaces")
@patch("python.gmskube.GMSKube.run_helm_list")
def test_list_name(
    mock_run_helm_list: MagicMock,
    mock_list_configmap: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_run_helm_list.return_value = (
        0,
        get_test_file_contents("cmds/run_helm_list.json"),
        ""
    )
    mock_list_configmap.return_value = PropertyMock(
        items=[
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "test",
                "gms/user": "testuser",
                "gms/type": "ian",
                "gms/update-time": "2021-12-20T210438Z",
                "gms/image-tag": "develop"
            })),
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "logging",
                "gms/user": "otheruser",
                "gms/type": "logging",
                "gms/update-time": "2021-11-24T013156Z",
                "gms/image-tag": "develop"
            }))
        ]
    )
    gmskube.console.width = 120
    gmskube.parse_args(shlex.split("ls test"))
    gmskube.list_instances()
    stdout, _ = capsys.readouterr()
    for instance_name in ["fleet-agent-local", "grafana", "logging"]:
        assert instance_name not in stdout
    assert (
        "test   deployed   ian    testuser   2021-12-20T210438Z   develop"
    ) in stdout


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_config_map_for_all_namespaces")
@patch("python.gmskube.GMSKube.run_helm_list")
def test_list_notexist(
    mock_run_helm_list: MagicMock,
    mock_list_configmap: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_run_helm_list.return_value = (
        0,
        get_test_file_contents("cmds/run_helm_list.json"),
        ""
    )
    mock_list_configmap.return_value = PropertyMock(
        items=[
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "test",
                "gms/user": "testuser",
                "gms/type": "ian",
                "gms/update-time": "2021-12-20T210438Z",
                "gms/image-tag": "develop"
            })),
            PropertyMock(metadata=PropertyMock(labels={
                "gms/name": "logging",
                "gms/user": "otheruser",
                "gms/type": "logging",
                "gms/update-time": "2021-11-24T013156Z",
                "gms/image-tag": "develop"
            }))
        ]
    )
    gmskube.show_all = False
    gmskube.instance_name = "doesnotexist"
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.list_instances()
    assert ("Instance name `doesnotexist` does not exist") in exc_info.value.args[0]


@patch("python.gmskube.GMSKube.run_helm_list")
def test_list_helm_list_fail(
    mock_run_helm_list: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_run_helm_list.return_value = (1, "", "helm list failed")
    gmskube.show_all = False
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.list_instances()
    assert "Could not list instances\nhelm list failed" in exc_info.value.args[0]


# ----- Ingress tests
@pytest.mark.parametrize("service", [None, "test-service"])
@pytest.mark.parametrize("is_istio", [True, False])
@patch("kubernetes.client.api.custom_objects_api.CustomObjectsApi.list_namespaced_custom_object")
@patch("kubernetes.client.api.networking_v1_api.NetworkingV1Api.list_namespaced_ingress")
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.is_istio", new_callable=PropertyMock)
def test_list_ingress_routes(
    mock_is_istio: MagicMock,
    mock_ingress_port: MagicMock,
    mock_list_ingress: MagicMock,
    mock_list_custom_object: MagicMock,
    is_istio: bool,
    service: str | None,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_is_istio.return_value = is_istio
    mock_ingress_port.return_value = "8443" if is_istio else "443"
    mock_list_ingress.return_value = RecursiveNamespace(
        **{
            "items": [
                {
                    "spec": {
                        "rules": [
                            {
                                "host": "test.cluster.com",
                                "http": {
                                    "paths": [
                                        {
                                            "backend": {
                                                "service": {
                                                    "name": "test-service",
                                                    "port": {
                                                        "number": 8080
                                                    }
                                                }
                                            },
                                            "path": "/test-service(/|$)(.*)",
                                            "pathType": "Prefix"
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "spec": {
                        "rules": [
                            {
                                "host": "prometheus-test.cluster.com",
                                "http": {
                                    "paths": [
                                        {
                                            "backend": {
                                                "service": {
                                                    "name": "prometheus",
                                                    "port": {
                                                        "number": 8080
                                                    }
                                                }
                                            },
                                            "path": "/",
                                            "pathType": "Prefix"
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        }
    )
    mock_list_custom_object.return_value = {
        "items":
        [
            {
                "metadata": {"name": "test-service"},
                "spec": {
                    "hosts": ["test.cluster.com"],
                    "http": [{"match": [{"uri": {"prefix": "/test-service/"}}, {"uri": {"exact": "/test-service"}}]}]
                }
            },
            {
                "metadata": {"name": "prometheus"},
                "spec": {
                    "hosts": ["prometheus-test.cluster.com"],
                    "http": [{"match": [{"uri": {"prefix": "/"}}]}]
                }
            }
        ]
    }
    gmskube.parse_args(
        shlex.split(
            "ingress "
            + ("" if service is None else f"--service {service} ")
            + "--timeout 4 test"
        )
    )  # yapf: disable
    gmskube.list_ingress_routes()
    stdout, _ = capsys.readouterr()
    if service is None:
        assert bool(re.search(fr'test-service\s+https://test\.cluster\.com:{"8443" if is_istio else "443"}/test-service', stdout))
        assert bool(re.search(fr'prometheus\s+https://prometheus-test\.cluster\.com:{"8443" if is_istio else "443"}/', stdout))
    else:
        assert bool(re.search(fr'^https://test\.cluster\.com:{"8443" if is_istio else "443"}/test-service', stdout))
        assert "prometheus" not in stdout


# ----- Augment Apply tests
@patch("python.gmskube.GMSKube.upgrade_instance")
def test_apply_augmentation(
    mock_upgrade_instance: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_upgrade_instance.return_value = None
    gmskube.parse_args(
        shlex.split(
            "augment "
            "apply "
            "--name minio-test-reports "
            "--set key=value "
            "--tag test "
            "--timeout 4 "
            "test"
        )
    )
    gmskube.apply_augmentation()
    stdout, _ = capsys.readouterr()
    assert "Augmentation 'minio-test-reports' successfully applied to test" in stdout


@patch("python.gmskube.GMSKube.upgrade_instance")
def test_apply_augmentation_exception(
    mock_upgrade_instance: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_upgrade_instance.side_effect = Exception("test exception message")
    gmskube.parse_args(
        shlex.split(
            "augment "
            "apply "
            "--name minio-test-reports "
            "--tag test "
            "--timeout 4 "
            "test"
        )
    )
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.apply_augmentation()
    expected = (
        "Failed to apply augmentation `test` to instance `test`  test "
        "exception message"
    )
    for word in expected.split():
        assert word in exc_info.value.args[0]


# ----- Augment Delete tests
@patch("python.gmskube.GMSKube.upgrade_instance")
def test_delete_augmentation(
    mock_upgrade_instance: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_upgrade_instance.return_value = None
    gmskube.parse_args(
        shlex.split(
            "augment "
            "delete "
            "--name minio-test-reports "
            "--tag test "
            "--timeout 4 "
            "test"
        )
    )
    gmskube.delete_augmentation()
    stdout, _ = capsys.readouterr()
    assert (
        "Augmentation `minio-test-reports` successfully deleted from instance `test`"
    ) in stdout


@patch("python.gmskube.GMSKube.upgrade_instance")
def test_delete_augmentation_exception(
    mock_upgrade_instance: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_upgrade_instance.side_effect = Exception("test exception message")
    gmskube.parse_args(
        shlex.split(
            "augment "
            "delete "
            "--name minio-test-reports "
            "--tag test "
            "--timeout 4 "
            "test"
        )
    )
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.delete_augmentation()
    expected = (
        "Failed to delete augmentation `test` from instance `test`  test "
        "exception message"
    )
    for word in expected.split():
        assert word in exc_info.value.args[0]


# ----- Augment Catalog tests
@patch(
    "builtins.open",
    new_callable=mock_open,
    read_data=get_test_file_contents("augmentation/test_values.yaml")
)
def test_list_augmentations(
    mock_open: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    gmskube.list_augmentations()
    stdout, _ = capsys.readouterr()
    assert bool(re.search(r'aug1\s*harness\s+ian,database\s+my\sawesome\saugmentation', stdout))
    assert bool(re.search(r'aug-missing-labels\s+harness', stdout))
    assert bool(re.search(r'aug-missing-type\s+none\s+ian', stdout))


# ----- Other function tests
# ----- set_helm_path tests
@pytest.mark.parametrize(
    "kubernetes_version, helm_version",
    [
        ("1.20", "3.8"),
        ("1.21", "3.8"),
        ("1.22", "3.8"),
        ("1.23", "3.8"),
        ("1.24", "3.12"),
        ("1.25", "3.12"),
        ("1.26", "3.12"),
        ("1.27", "3.12")
    ]
)  # yapf: disable
@patch("python.gmskube.GMSKube.kubernetes_version", new_callable=PropertyMock)
def test_set_helm_path(
    mock_kubernetes_version: MagicMock,
    kubernetes_version: str,
    helm_version: str,
    gmskube: GMSKube
) -> None:
    mock_kubernetes_version.return_value = kubernetes_version
    gmskube.set_helm_path()
    assert f"/opt/helm_{helm_version}" in os.getenv("PATH")


@patch("python.gmskube.GMSKube.kubernetes_version", new_callable=PropertyMock)
def test_set_helm_path_not_supported(
    mock_kubernetes_version: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_kubernetes_version.return_value = '1.19'
    gmskube.set_helm_path()
    stdout, _ = capsys.readouterr()
    assert "Kubernetes version 1.19 detected." in stdout
    assert "Only Kubernetes versions 1.20-1.29" in stdout


# ----- request_data_load tests
@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("json.loads")
@patch("requests.Session.post")
@patch("requests.Session.get")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_service")
def test_request_dataload(
    mock_get_service: MagicMock,
    mock_get: MagicMock,
    mock_post: MagicMock,
    mock_loads: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_get_service.return_value = None
    mock_get.return_value = get_request_response(200)
    mock_post.return_value = get_request_response(200)
    mock_loads.return_value = {
        "status": "FINISHED",
        "successful": True,
        "partial_result": "partial dataload log",
        "result": "dataload log"
    }
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.com"
    gmskube.parse_args(
        shlex.split(
            "install "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    result = gmskube.request_dataload()
    stdout, _ = capsys.readouterr()
    assert "Waiting for config loader to be alive" in stdout
    assert "Requesting data load" in stdout
    assert "partial dataload log" in stdout
    assert "Data load successfully completed" in stdout
    assert result is True


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_service")
def test_request_dataload_read_service_raises_notfound(
    mock_get_configmap: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_get_configmap.side_effect = ApiException(reason="Not Found")
    gmskube.parse_args(
        shlex.split(
            "install "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    result = gmskube.request_dataload()
    stdout, _ = capsys.readouterr()
    expected = "config-loader service does not exist, skipping data load"
    for word in expected.split():
        assert word in stdout
    assert result is True


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_service")
def test_request_dataload_read_service_raises_other(
    mock_get_configmap: MagicMock,
    gmskube: GMSKube
) -> None:
    mock_get_configmap.side_effect = ApiException(reason="other")
    gmskube.parse_args(
        shlex.split(
            "install "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    with pytest.raises(ApiException):
        gmskube.request_dataload()


@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("json.loads")
@patch("requests.Session.post")
@patch("requests.Session.get")
@patch("python.gmskube.GMSKube.get_override_zip_file")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_service")
def test_request_dataload_config_overrides(
    mock_get_service: MagicMock,
    mock_get_override_zip_file: MagicMock,
    mock_get: MagicMock,
    mock_post: MagicMock,
    mock_loads: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_get_service.return_value = None
    mock_get_override_zip_file.return_value = "test"
    mock_get.return_value = get_request_response(200)
    mock_post.return_value = get_request_response(200)
    mock_loads.return_value = {
        "status": "FINISHED",
        "successful": True,
        "partial_result": "partial dataload log",
        "result": "dataload log"
    }
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.com"
    gmskube.parse_args(
        shlex.split(
            "install "
            f"--config {get_config_overrides_path()} "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    result = gmskube.request_dataload()
    stdout, _ = capsys.readouterr()
    assert "Requesting data load" in stdout
    assert "partial dataload log" in stdout
    assert "Data load successfully completed" in stdout
    assert result is True


@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.get_override_zip_file")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_service")
def test_request_dataload_config_overrides_get_override_zip_file_fail(
    mock_get_service: MagicMock,
    mock_get_override_zip_file: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube
) -> None:
    mock_get_service.return_value = None
    mock_get_override_zip_file.return_value = None
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.com"
    gmskube.parse_args(
        shlex.split(
            "install "
            f"--config {get_config_overrides_path()} "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.request_dataload()
    expected = "Unable to create zip file from user supplied overrides"
    for word in expected.split():
        assert word in exc_info.value.args[0]


@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("json.loads")
@patch("requests.Session.post")
@patch("requests.Session.get")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_service")
def test_request_dataload_alive_timeout(
    mock_get_service: MagicMock,
    mock_get: MagicMock,
    mock_post: MagicMock,
    mock_loads: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_get_service.return_value = None
    mock_get.return_value = get_request_response(500)
    mock_post.return_value = get_request_response(200)
    mock_loads.return_value = {
        "status": "FINISHED",
        "successful": True,
        "partial_result": "partial dataload log",
        "result": "dataload log"
    }
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.com"
    gmskube.parse_args(
        shlex.split(
            "install "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    gmskube.timeout = 0.006
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.request_dataload()
    stdout, _ = capsys.readouterr()
    expected = [
        "Waiting for config loader to be alive",
        "Timed out waiting for config loader to be alive, will attempt data "
        "load anyway",
    ]
    for line in expected:
        for word in line.split():
            assert word in stdout
    assert "Data load response status is unknown" in exc_info.value.args[0]


@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("requests.Session.post")
@patch("requests.Session.get")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_service")
def test_request_dataload_post_load_fail(
    mock_get_service: MagicMock,
    mock_get: MagicMock,
    mock_post: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_get_service.return_value = None
    mock_get.return_value = get_request_response(200)
    mock_post.return_value = get_request_response(500)
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.com"
    gmskube.parse_args(
        shlex.split(
            "install "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.request_dataload()
    stdout, _ = capsys.readouterr()
    assert "Requesting data load" in stdout
    assert "Failed to initiate a data load. 500: None" in exc_info.value.args[0]


@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("json.loads")
@patch("requests.Session.post")
@patch("requests.Session.get")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_service")
def test_request_dataload_result_response_unsuccessful(
    mock_get_service: MagicMock,
    mock_get: MagicMock,
    mock_post: MagicMock,
    mock_loads: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube
) -> None:
    mock_get_service.return_value = None
    mock_get.return_value = get_request_response(200)
    mock_post.return_value = get_request_response(200)
    mock_loads.return_value = {
        "status": "FINISHED",
        "successful": False,
        "partial_result": "partial dataload log",
        "result": "dataload log"
    }
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.com"
    gmskube.parse_args(
        shlex.split(
            "install "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.request_dataload()
    expected = "Data load failed to execute successfully, Exiting"
    for word in expected.split():
        assert word in exc_info.value.args[0]


@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("json.loads")
@patch("requests.Session.post")
@patch("requests.Session.get")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_service")
def test_request_dataload_status_not_finished(
    mock_get_service: MagicMock,
    mock_get: MagicMock,
    mock_post: MagicMock,
    mock_loads: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube
) -> None:
    mock_get_service.return_value = None
    mock_get.return_value = get_request_response(200)
    mock_post.return_value = get_request_response(200)
    mock_loads.return_value = {
        "status": "NOT DONE",
        "successful": True,
        "partial_result": "partial dataload log",
        "result": "dataload log"
    }
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.com"
    gmskube.parse_args(
        shlex.split(
            "install "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    gmskube.timeout = 0.006
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.request_dataload()
    assert "Timed out waiting for data load after 0.006 minutes, Exiting" in exc_info.value.args[0]


@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.get_override_zip_file")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_service")
def test_request_dataload_exception(
    mock_get_service: MagicMock,
    mock_get_override_zip_file: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube
) -> None:
    mock_get_service.return_value = None
    mock_get_override_zip_file.side_effect = RuntimeError(
        "test exception message"
    )
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.com"
    gmskube.config_override_path = get_config_overrides_path()
    gmskube.parse_args(
        shlex.split(
            "install "
            f"--config {get_config_overrides_path()} "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.request_dataload()
    assert "test exception message" in exc_info.value.args[0]


@patch("python.gmskube.GMSKube.base_domain", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.ingress_port", new_callable=PropertyMock)
@patch("json.loads")
@patch("requests.Session.post")
@patch("requests.Session.get")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_service")
def test_request_dataload_json_decode_exception(
    mock_get_service: MagicMock,
    mock_get: MagicMock,
    mock_post: MagicMock,
    mock_loads: MagicMock,
    mock_ingress_port: MagicMock,
    mock_base_domain: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_get_service.return_value = None
    mock_get.return_value = get_request_response(200)
    mock_post.return_value = get_request_response(200)
    mock_loads.side_effect = JSONDecodeError("error decoding", "dock error", 0)
    mock_ingress_port.return_value = "443"
    mock_base_domain.return_value = "test.cluster.com"
    gmskube.parse_args(
        shlex.split(
            "install "
            f"--config {get_config_overrides_path()} "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    gmskube.timeout = 0.001
    with pytest.raises(RuntimeError) as exc_info:
        gmskube.request_dataload()
    stdout, _ = capsys.readouterr()
    assert "Unable to convert response to json" in stdout
    assert "Data load response status is unknown" in exc_info.value.args[0]


# ----- get_override_zip_file tests
def test_get_override_zip_file(gmskube: GMSKube) -> None:
    gmskube.parse_args(
        shlex.split(
            "install "
            f"--config {get_config_overrides_path()} "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    result = gmskube.get_override_zip_file()
    assert result is not None
    with zipfile.ZipFile(io.BytesIO(result), "r") as zip_file:
        assert len(zip_file.infolist()) == 3


def test_get_override_zip_file_path_not_exists(gmskube: GMSKube) -> None:
    gmskube.parse_args(
        shlex.split(
            "install "
            "--config /tmp "
            "--tag develop "
            "--timeout 4 "
            "--type ian "
            "test"
        )
    )
    result = gmskube.get_override_zip_file()
    assert result is not None
    with zipfile.ZipFile(io.BytesIO(result), "r") as zip_file:
        assert len(zip_file.infolist()) == 0


# ----- is_istio tests
@pytest.mark.parametrize(
    "is_istio, labels",
    [
        (True, {"istio-injection": "enabled"}),
        (False, {"istio-injection": "disabled"}),
        (False, {})
    ]
)
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespace")
def test_is_istio(
    mock_get_namespace: MagicMock,
    is_istio: bool,
    labels: dict,
    gmskube: GMSKube,
) -> None:
    mock_get_namespace.return_value = PropertyMock(
        metadata=PropertyMock(labels=labels)
    )
    gmskube.instance_name = "test"
    result = gmskube.is_istio
    assert result == is_istio


# ----- ingress_ports_config tests
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_config_map")
def test_ingress_ports_config(
    mock_get_configmap: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_get_configmap.return_value = MagicMock(
        data={
            "base_domain": "test.gms.domain.com",
            "istio_port": "8443",
            "nginx_port": "443"
        }
    )
    data = gmskube.ingress_ports_config
    assert data["base_domain"] == "test.gms.domain.com"
    assert data["istio_port"] == "8443"
    assert data["nginx_port"] == "443"


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_config_map")
def test_ingress_ports_config_raises_notfound(
    mock_get_configmap: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_get_configmap.side_effect = ApiException(reason="Not Found")
    with pytest.raises(RuntimeError) as e:
        gmskube.ingress_ports_config
    msg = e.value.args[0]
    assert "Configmap 'ingress-ports-config' not found in 'gms' namespace." in msg


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_config_map")
def test_ingress_ports_config_raises_other(
    mock_get_configmap: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_get_configmap.side_effect = ApiException(reason="Other")
    with pytest.raises(ApiException):
        gmskube.ingress_ports_config


# ----- base_domain tests
@patch("python.gmskube.GMSKube.ingress_ports_config", new_callable=PropertyMock)
def test_base_domain(
    mock_ingress_ports_config: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_ingress_ports_config.return_value = {
        "base_domain": "test.gms.domain.com",
        "istio_port": "8443",
        "nginx_port": "443"
    }
    assert gmskube.base_domain == "test.gms.domain.com"


# ----- ingress_port tests
@pytest.mark.parametrize("is_istio", [True, False])
@pytest.mark.parametrize("port", [None, 9999])
@patch("python.gmskube.GMSKube.ingress_ports_config", new_callable=PropertyMock)
def test_ingress_port(
    mock_ingress_ports_config: MagicMock,
    port: str,
    is_istio: bool,
    gmskube: GMSKube,
) -> None:
    gmskube.parse_args(
        shlex.split(
            "install "
            + ("--istio" if is_istio else "--no-istio")
            + (f" --port {port}" if port is not None else "")
            + " --tag develop "
            + "--timeout 4 "
            + "--type ian "
            + "test"
        )
    )
    mock_ingress_ports_config.return_value = {
        "base_domain": "test.gms.domain.com",
        "istio_port": "8443",
        "nginx_port": "443"
    }
    if port is not None:
        assert gmskube.ingress_port == port
    else:
        assert gmskube.ingress_port == f"{'8443' if is_istio else '443'}"


# ----- kubernetes_version tests
@pytest.mark.parametrize(
    "major, minor",
    [
        ("1", "20"),
        ("1", "27")
    ]
)  # yapf: disable
@patch("kubernetes.client.api.version_api.VersionApi.get_code")
def test_kubernetes_version(
    mock_get_version: MagicMock,
    major: str,
    minor: str,
    gmskube: GMSKube
) -> None:
    mock_get_version.return_value = MagicMock(major=major, minor=minor)
    assert f"{major}.{minor}" == gmskube.kubernetes_version


@patch("kubernetes.client.api.version_api.VersionApi.get_code")
def test_kubernetes_version_raises(
    mock_get_version: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_get_version.side_effect = ApiException("run kubectl version failed")
    with pytest.raises(ApiException):
        gmskube.kubernetes_version


# ----- kubernetes_context_name tests
@patch("kubernetes.config.list_kube_config_contexts")
def test_kubernetes_context_name(
    mock_list_contexts: MagicMock,
    gmskube: GMSKube
) -> None:
    mock_list_contexts.return_value = [None, {"name": "blue"}]
    assert "blue" == gmskube.kubernetes_context_name


# ----- run_command tests
def test_run_command(gmskube: GMSKube) -> None:
    return_code, stdout, stderr = gmskube.run_command(
        "echo 'test'",
        print_output=True
    )
    assert return_code == 0
    assert stdout == "test\n"
    assert stderr == ""


def test_run_command_no_print_output(
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    command = "echo 'test'"
    return_code, stdout, stderr = gmskube.run_command(
        command,
        print_output=False
    )
    assert return_code == 0
    assert stdout == "test\n"
    assert stderr == ""
    stdout, stderr = capsys.readouterr()
    assert "test" not in stdout
    assert "test" not in stderr


def test_run_command_print_output_error(gmskube: GMSKube) -> None:
    return_code, stdout, stderr = gmskube.run_command(
        "boguscmd",
        print_output=True
    )
    assert return_code == 127
    assert stdout == ""
    assert "not found" in stderr


# ----- print_warning tests
def test_print_warning(
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    gmskube.print_warning("test warning")
    stdout, _ = capsys.readouterr()
    assert "[WARNING] test warning" in stdout


# ----- print_error tests
def test_print_error(gmskube: GMSKube, capsys: pytest.CaptureFixture) -> None:
    gmskube.print_error("test error")
    stdout, _ = capsys.readouterr()
    assert "[ERROR] test error" in stdout


# ----- create_namespace tests
@pytest.mark.parametrize("is_istio", [True, False])
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.create_namespace")
def test_create_namespace(
    mock_create_namespace: MagicMock,
    is_istio: bool,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_create_namespace.return_value = None
    gmskube.parse_args(
        shlex.split(
            "install "
            + ("--istio" if is_istio else "--no-istio")
            + " --tag develop "
            + "--timeout 4 "
            + "--type ian "
            + "test"
        )
    )  # yapf: disable
    gmskube.create_namespace()
    if is_istio:
        stdout, _ = capsys.readouterr()
        assert "Adding `istio-injection=enabled` label" in stdout


@pytest.mark.parametrize(
    "side_effect, raises",
    [
        (ApiException(reason="Conflict"), pytest.raises(RuntimeError)),
        (ApiException(reason="Other"), pytest.raises(ApiException))
    ]
)
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.create_namespace")
def test_create_namespace_raises(
    mock_create_namespace: MagicMock,
    side_effect,
    raises,
    gmskube: GMSKube
) -> None:
    mock_create_namespace.side_effect = side_effect
    gmskube.parse_args(
        shlex.split(
            "install "
            + "--istio"
            + " --tag develop "
            + "--timeout 4 "
            + "--type ian "
            + "test"
        )
    )  # yapf: disable
    with raises:
        gmskube.create_namespace()


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.create_namespace")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.patch_namespace")
def test_create_namespace_reuse_namespace(
    mock_patch_namespace: MagicMock,
    mock_create_namespace: MagicMock,
    gmskube: GMSKube
) -> None:
    mock_patch_namespace.return_value = None
    mock_create_namespace.side_effect = ApiException(reason="Conflict")
    gmskube.parse_args(
        shlex.split(
            "install "
            + "--istio"
            + " --tag develop "
            + "--timeout 4 "
            + "--type ian "
            + "--reuse-namespace "
            + "test"
        )
    )  # yapf: disable
    gmskube.create_namespace()


def test_validate_instance_name_pass(gmskube: GMSKube) -> None:
    gmskube.instance_name = "test-1234"
    gmskube.validate_instance_name()


def test_validate_instance_name_fail(gmskube: GMSKube) -> None:
    with pytest.raises(ArgumentTypeError):
        gmskube.instance_name = "awesome@_test"
        gmskube.validate_instance_name()


# ----- instance_type tests
@pytest.mark.parametrize("custom", [None, "custom"])
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_config_map")
def test_instance_type(
    mock_get_configmap: MagicMock,
    custom: str,
    gmskube: GMSKube,
) -> None:
    mock_get_configmap.return_value = PropertyMock(
        metadata=PropertyMock(labels={"gms/type": "ian"})
    )
    gmskube.instance_name = "test"
    gmskube.custom_chart_path = custom
    if custom is not None:
        assert gmskube.instance_type == 'custom'
    else:
        assert gmskube.instance_type == 'ian'


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_config_map")
def test_instance_type_raises_notfound(
    mock_get_configmap: MagicMock,
    gmskube: GMSKube,
) -> None:
    gmskube.instance_name = 'test'
    mock_get_configmap.side_effect = ApiException(reason="Not Found")
    with pytest.raises(RuntimeError) as e:
        gmskube.instance_type
    msg = e.value.args[0]
    assert "Configmap 'gms' not found in 'test' namespace." in msg


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_config_map")
def test_instance_type_raises_keyerror(
    mock_get_configmap: MagicMock,
    gmskube: GMSKube,
) -> None:
    gmskube.instance_name = 'test'
    mock_get_configmap.return_value = PropertyMock(
        metadata=PropertyMock(labels={"junk": "nothing"})
    )
    with pytest.raises(RuntimeError) as e:
        gmskube.instance_type
    msg = e.value.args[0]
    assert "Unable to determine instance time from 'gms' configmap in 'test' namespace." in msg


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_config_map")
def test_instance_type_raises_apiexception(
    mock_get_configmap: MagicMock,
    gmskube: GMSKube,
) -> None:
    gmskube.instance_name = 'test'
    mock_get_configmap.side_effect = ApiException(reason="other")
    with pytest.raises(ApiException):
        gmskube.instance_type


# ----- Check tests
@pytest.mark.parametrize(
    "kubernetes_version, passfail",
    [
        ("1.19", "WARN"),
        ("1.20", "PASS"),
        ("1.24", "PASS"),
        ("1.27", "PASS"),
        ("1.30", "WARN")
    ]
)
@patch("python.gmskube.GMSKube.kubernetes_version", new_callable=PropertyMock)
@patch("python.gmskube.GMSKube.check_resource_exists")
@patch("python.gmskube.GMSKube.check_all_pods_ready")
@patch("python.gmskube.GMSKube.check_all_nodes_ready")
def test_check_kubernetes(
    mock_check_all_nodes_ready: MagicMock,
    mock_check_all_pods_ready: MagicMock,
    mock_check_resource_exists: MagicMock,
    mock_kubernetes_version: MagicMock,
    kubernetes_version: str,
    passfail: str,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_check_all_nodes_ready.return_value = None
    mock_check_all_pods_ready.return_value = None
    mock_check_resource_exists.return_value = None
    mock_kubernetes_version.return_value = kubernetes_version
    gmskube.check_kubernetes()
    stdout, _ = capsys.readouterr()
    assert f'Kubernetes version: {passfail} - {kubernetes_version}' in stdout


@pytest.mark.parametrize(
    "pods",
    [
        {
            "items": [
                {
                    "status": {
                        "conditions": [
                            {
                                "status": "True",
                                "type": "Ready"
                            }
                        ],
                        "phase": "Running"
                    }
                }
            ]
        },
        {
            "items": [
                {
                    "status": {
                        "conditions": [
                            {
                                "status": "False",
                                "type": "Ready"
                            }
                        ],
                        "phase": "Succeeded"
                    }
                }
            ]
        }
    ]
)
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_namespaced_pod")
def test_check_all_pods_ready(
    mock_list_pod: MagicMock,
    pods: dict,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_list_pod.return_value = RecursiveNamespace(**pods)
    result = gmskube.check_all_pods_ready('istio-system')
    stdout, _ = capsys.readouterr()
    assert result
    assert 'istio-system pods: PASS' in stdout


@pytest.mark.parametrize(
    "pods",
    [
        {"items": []},
        {
            "items": [
                {
                    "status": {
                        "conditions": [
                            {
                                "status": "True",
                                "type": "Initialized"
                            },
                            {
                                "status": "False",
                                "type": "Ready"
                            }
                        ],
                        "phase": "Running"
                    }
                }
            ]
        },
        {
            "items": [
                {
                    "status": {
                        "conditions": [
                            {
                                "status": "False",
                                "type": "Ready"
                            }
                        ],
                        "phase": "Failed"
                    }
                }
            ]
        }
    ]
)
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_namespaced_pod")
def test_check_all_pods_ready_false(
    mock_list_pod: MagicMock,
    pods: dict,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_list_pod.return_value = RecursiveNamespace(**pods)
    result = gmskube.check_all_pods_ready('istio-system')
    stdout, _ = capsys.readouterr()
    assert not result
    assert 'istio-system pods: FAIL' in stdout


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespace")
def test_check_namespace_exists(
    mock_get_namespace: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_get_namespace.return_value = None
    assert gmskube.check_namespace_exists('istio-system')


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespace")
def test_check_namespace_exists_false(
    mock_get_namespace: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_get_namespace.side_effect = ApiException(reason="Not Found")
    assert not gmskube.check_namespace_exists('istio-system')


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespace")
def test_check_namespace_exists_raises(
    mock_get_namespace: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_get_namespace.side_effect = ApiException(reason="Other")
    with pytest.raises(ApiException):
        gmskube.check_namespace_exists('istio-system')


@pytest.mark.parametrize("exists", [True, False])
@patch("python.gmskube.GMSKube.check_namespace_exists")
@patch("python.gmskube.GMSKube.check_all_pods_ready")
@patch("python.gmskube.GMSKube.check_resource_exists")
def test_check_istio(
    mock_check_resource_exists: MagicMock,
    mock_check_all_pods_ready: MagicMock,
    mock_check_namespace_exists: MagicMock,
    exists: bool,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_check_resource_exists.return_value = exists
    mock_check_all_pods_ready.return_value = exists
    mock_check_namespace_exists.return_value = exists
    gmskube.check_istio()
    stdout, _ = capsys.readouterr()
    assert f"istio-system namespace: {'PASS' if exists else 'FAIL'}" in stdout


@pytest.mark.parametrize("exists", [True, False])
@patch("python.gmskube.GMSKube.check_namespace_exists")
@patch("python.gmskube.GMSKube.check_all_pods_ready")
def test_check_longhorn(
    mock_check_all_pods_ready: MagicMock,
    mock_check_namespace_exists: MagicMock,
    exists: bool,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_check_all_pods_ready.return_value = exists
    mock_check_namespace_exists.return_value = exists
    gmskube.check_longhorn()
    stdout, _ = capsys.readouterr()
    assert f"longhorn-system namespace: {'PASS' if exists else 'WARN'}" in stdout


@pytest.mark.parametrize("exists", [True, False])
@patch("python.gmskube.GMSKube.check_namespace_exists")
@patch("python.gmskube.GMSKube.check_all_pods_ready")
def test_check_rancher_monitoring(
    mock_check_all_pods_ready: MagicMock,
    mock_check_namespace_exists: MagicMock,
    exists: bool,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_check_all_pods_ready.return_value = exists
    mock_check_namespace_exists.return_value = exists
    gmskube.check_rancher_monitoring()
    stdout, _ = capsys.readouterr()
    assert f"cattle-monitoring-system namespace: {'PASS' if exists else 'WARN'}" in stdout


@pytest.mark.parametrize("exists", [True, False])
@patch("python.gmskube.GMSKube.check_resource_exists")
@patch("python.gmskube.GMSKube.check_namespace_exists")
def test_check_gms_ns(
    mock_check_namespace_exists: MagicMock,
    mock_check_resource_exists: MagicMock,
    exists: bool,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_check_namespace_exists.return_value = exists
    mock_check_resource_exists.return_value = exists
    gmskube.check_gms_ns()
    stdout, _ = capsys.readouterr()
    if exists:
        assert 'gms namespace: PASS - exists' in stdout
    else:
        assert 'gms namespace: FAIL - missing, run `gmskube cluster init`' in stdout


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_node")
def test_check_all_nodes_ready(
    mock_list_node: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_list_node.return_value = RecursiveNamespace(
        **{
            "items": [
                {
                    "status": {
                        "conditions": [
                            {
                                "status": "True",
                                "type": "Ready"
                            }
                        ]
                    }
                }
            ]
        }
    )
    result = gmskube.check_all_nodes_ready()
    stdout, _ = capsys.readouterr()
    assert result
    assert 'node status: PASS' in stdout


@pytest.mark.parametrize(
    "nodes",
    [
        {"items": []},
        {
            "items": [
                {
                    "status": {
                        "conditions": [
                            {
                                "status": "True",
                                "type": "Initialized"
                            },
                            {
                                "status": "False",
                                "type": "Ready"
                            }
                        ]
                    }
                }
            ]
        }
    ]
)
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.list_node")
def test_check_all_nodes_ready_false(
    mock_list_node: MagicMock,
    nodes: dict,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_list_node.return_value = RecursiveNamespace(**nodes)
    result = gmskube.check_all_nodes_ready()
    stdout, _ = capsys.readouterr()
    assert not result
    assert 'node status: FAIL' in stdout


@pytest.mark.parametrize("resource_type", ["Configmap", "secret", "GateWay"])
@patch("kubernetes.client.api.custom_objects_api.CustomObjectsApi.get_namespaced_custom_object")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_secret")
@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_config_map")
def test_check_resource_exists(
    mock_get_configmap: MagicMock,
    mock_get_secret: MagicMock,
    mock_get_custom_object: MagicMock,
    resource_type: str,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_get_configmap.return_value = None
    mock_get_secret.return_value = None
    mock_get_custom_object.return_value = None
    result = gmskube.check_resource_exists('test', resource_type, 'testobj')
    stdout, _ = capsys.readouterr()
    assert result
    assert f"test {resource_type} testobj: PASS - exists" in stdout


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_config_map")
def test_check_resource_exists_false(
    mock_get_configmap: MagicMock,
    gmskube: GMSKube,
    capsys: pytest.CaptureFixture
) -> None:
    mock_get_configmap.side_effect = ApiException(reason="Not Found")
    result = gmskube.check_resource_exists('test', 'configmap', 'testobj')
    stdout, _ = capsys.readouterr()
    assert not result
    assert "test configmap testobj: FAIL - missing" in stdout


@patch("kubernetes.client.api.core_v1_api.CoreV1Api.read_namespaced_config_map")
def test_check_resource_exists_raises_apiexception(
    mock_get_configmap: MagicMock,
    gmskube: GMSKube,
) -> None:
    mock_get_configmap.side_effect = ApiException(reason="other")
    with pytest.raises(ApiException):
        gmskube.check_resource_exists('test', 'configmap', 'testobj')


def test_check_resource_exists_raises_typeerror(
    gmskube: GMSKube,
) -> None:
    with pytest.raises(TypeError):
        gmskube.check_resource_exists('test', 'unknown', 'testobj')
