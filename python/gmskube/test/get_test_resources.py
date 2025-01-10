#!/usr/bin/env python3
import requests
import json
from pathlib import Path


def get_resource_path(resource: Path | str) -> Path:
    """
    Gets the Path to a file/directory in the resources directory
    :param resource: Relative Path (or string) to the file/directory in the resources
        directory
    :return: Path
    """
    if type(resource) is str:
        resource = Path(resource)
    return Path(__file__).resolve().parent / "resources" / resource


def get_test_custom_chart_path() -> Path:
    """
    Gets the Path to a test custom chart
    :return: Path
    """
    return get_resource_path("custom-chart")


def get_config_overrides_path() -> Path:
    """
    Gets the Path to a test config overrides
    :return: Path
    """
    return get_resource_path("config_overrides")


def get_test_file_contents(resource: Path | str) -> str:
    """
    Gets the contents of a test resource file
    :param resource: relative Path (or string path) to the resource file in resources directory
    :return: string with contents of the test file
    """
    with open(get_resource_path(resource), "r") as test_file:
        return test_file.read()


def get_test_file_json(resource: Path | str):
    """
    Gets the contents of a test resource file as json
    :param resource: releative Path (or string path) to the resource file in the resources directory
    :return: json dict with contents of the test file
    """
    return json.loads(get_test_file_contents(resource))


def get_request_response(status_code: int) -> requests.Response:
    """
    Gets a requests.Response object with the http status_code set
    :param status_code: http status code to be set
    :return: requests.Response object
    """

    response = requests.Response()
    response.status_code = status_code
    return response
