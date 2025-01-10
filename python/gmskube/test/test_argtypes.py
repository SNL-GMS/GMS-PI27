#!/usr/bin/env python3
from argparse import ArgumentTypeError

import pytest

from python.gmskube import ArgTypes


def test_augment_set() -> None:
    ArgTypes.augment_set("env=value")


@pytest.mark.parametrize(
    "set_string, error",
    [("=value",
      "supply the Helm chart name/value pair as `Name=Value`"),
     ("env.test=value",
      "top-level `env` has been replaced with `global")]
)
def test_set_fail(set_string: str, error: str) -> None:
    with pytest.raises(ArgumentTypeError) as ex:
        ArgTypes.set(set_string)
    assert error in ex.value.args[0]


@pytest.mark.parametrize(
    "set_string",
    ["label=value",
     "label=",
     "global.env.test=value"]
)
def test_set_pass(set_string: str) -> None:
    ArgTypes.set(set_string)


@pytest.mark.parametrize(
    "tag_string, expected", [
        ("no-changes", "no-changes"),
        ("TO-LOWER-CASE", "to-lower-case"),
        ("rep!ace-$pecial", "rep-ace--pecial"),
        ("--remove-leading-trailing-----", "remove-leading-trailing"),
        ("this-is-the-tag-that-never-ends-yes-it-goes-on-and-on-my-friend-"
         "some-people-started-typing-it-not-knowing-what-it-was-and-theyll-"
         "continue-typing-it-forever-just-because---",
         "this-is-the-tag-that-never-ends-yes-it-goes-on-and-on-my-friend")
    ]
)  # yapf: disable
def test_tag(tag_string: str, expected: str) -> None:
    assert ArgTypes.tag(tag_string) == expected
