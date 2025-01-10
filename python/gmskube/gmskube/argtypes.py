#!/usr/bin/env python3
import re
from argparse import ArgumentTypeError


class ArgTypes:
    """
    This class defines methods that can be used to validate `gmskube`
    command line input.  It can be used to allow other scripts to
    validate `gmskube` command line arguments as well.  To use one of
    the methods as a validator, simply:

    .. code-block:: python

        parser = ArgumentParser()
        parser.add_argument("--foo", type=ArgTypes.bar)
        ...
    """

    @staticmethod
    def augment_set(input_string: str) -> str:
        """
        Validate the `--set` argument for augmentations, without
        checking whether environment variables are set under the
        `global` namespace.

        Args:
            input_string:  The set string input by the user.

        Raises:
            ArgumentTypeError:  If the format is invalid.

        Returns:
            The input string.
        """
        return __class__.set(input_string, check_env=False)

    @staticmethod
    def set(input_string: str, check_env: bool = True) -> str:
        """
        Use a regular expression to match a Helm value of the form
        `VARIABLE=VALUE`.  Helm accepts a lot of different values, so
        the regex is not very restrictive to allow for all the different
        forms.

        Args:
            input_string:  The set string input by the user.
            check_env:  Whether to ensure environment variables are set
                under the `global` namespace.

        Raises:
            ArgumentTypeError:  If the format is invalid.

        Returns:
            The input string.
        """
        if not re.match(r"^.+=.*", input_string):
            raise ArgumentTypeError(
                "When specifying `--set`, you must supply the Helm chart "
                "name/value pair as `Name=Value`."
            )
        if check_env and re.match(r"^env\..+=.*", input_string):
            raise ArgumentTypeError(
                "The old top-level `env` has been replaced with `global.env`. "
                "Please update any `--set env.foo=bar` "
                "arguments to `--set global.env.foo=bar`."
            )
        return input_string

    @staticmethod
    def tag(input_string: str) -> str:
        """
        Transform the given tag into the `CI_COMMIT_REF_SLUG` as defined
        by GitLab.

        Args:
            input_tag:  The Docker image tag input by the user; the git
                branch/tag name or SHA1.

        Returns:
            The given tag, lower-cased, shortened to 63 bytes, with
            everything except `0-9` and `a-z` replaced with `-`, and no
            leading / trailing `-`.
        """
        lowercase = input_string.lower()
        no_special_chars = re.sub(r"[^a-z0-9]", "-", lowercase)
        no_leading_trailing_chars = no_special_chars.strip("-")
        return no_leading_trailing_chars[:63]
