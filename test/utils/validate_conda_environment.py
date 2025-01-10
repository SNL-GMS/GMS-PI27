"""
This file used to check that the python environment was setup, but that has
been deprecated.
"""
from pathlib import Path
import os

from deepdiff import DeepDiff
import requests
import yaml
from rich.console import Console

console_kwargs = {"log_path": False}
if os.getenv("CI"):
    console_kwargs["force_terminal"] = True
if os.getenv("RICH_LOG_PATH"):
    console_kwargs["log_path"] = True
console = Console(**console_kwargs)
