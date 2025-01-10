#!/usr/local/bin python3

import argparse
import sys

from gmsdataloader.processingconfig import ProcessingConfigLoader

from gmsdataloader.userpreferences import (
    UserPreferencesLoader,
    UserPreferencesLoaderConfig
)

PYTHON_CONFIG_HELP = 'Specify an alternate loader config (Python INI)'


def setup_user_preferences_parser(parser: argparse.ArgumentParser):
    parser.add_argument(
        '-c',
        '--config',
        help=PYTHON_CONFIG_HELP,
        required=False,
        default=None
    )
    # TODO remove: default='dataloaders/userpreferences/resources/config/
    #      config.ini')
    parser.add_argument(
        '-f',
        '--file',
        help='Specify an alternate user preferences file (JSON)',
        required=False,
        default='resources/defaultUserPreferences.json'
    )
    parser.set_defaults(action=load_user_preferences)


def load_user_preferences(args: argparse.Namespace):
    url = args.url
    config_file = args.config
    preferences_file = args.file

    config = UserPreferencesLoaderConfig(url, config_file)
    loader = UserPreferencesLoader(config)

    loader.load_user_preferences(preferences_file)


def setup_processing_config_parser(parser: argparse.ArgumentParser):
    parser.add_argument(
        '--processing-configuration-root',
        help='Path to Root directory containing Processing Configurations '
        '(optional)',
        required=False,
        default='config/processing'
    )
    parser.add_argument(
        '-u',
        '--url',
        help='Path to location of frameworks configuration service',
        required=True
    )
    parser.set_defaults(action=load_processing_config)


def load_processing_config(args: argparse.Namespace):
    loader = ProcessingConfigLoader(
        args.url,
        args.processing_configuration_root
    )
    loader.load()


if __name__ == '__main__':
    args_parser = argparse.ArgumentParser(prog='gms-data-loader')
    command_parser = args_parser.add_subparsers()

    setup_processing_config_parser(
        command_parser.add_parser(
            'load-processing-config',
            aliases=['lpc'],
            help='Load Processing Configuration into the Configuration Service'
        )
    )

    if len(sys.argv) <= 1:
        args_parser.print_help()
    else:
        args = args_parser.parse_args(sys.argv[1:])
        args.action(args)
