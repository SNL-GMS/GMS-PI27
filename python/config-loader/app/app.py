#!/usr/bin/env python3

# --------------------------------------------------------------------
#  config-loader
#
#  The config-loader service...
# --------------------------------------------------------------------

import logging
import logging.handlers
import os
import shutil
import zipfile
from io import StringIO

from flask import Flask, Response, current_app, jsonify, request

logger = logging.getLogger(__package__)


def create_app(env=None):
    from . import (
        app_state,
        config_by_name,
        executor,
        initiate_load,
        initiate_reload,
        log_queue
    )

    app = Flask(__name__)
    app.config.from_object(config_by_name[env or "test"])

    logging.basicConfig(
        format='[%(asctime)s] [%(process)s] [%(levelname)s] %(message)s',
        level=app.config['LOG_LEVEL']
    )

    executor.init_app(app)

    with app.app_context():

        # Environment option to automatically load default
        # configuration on startup for testing
        if environment_bool('GMS_CONFIG_AUTOLOAD_DEFAULTS'):
            with app.test_request_context():
                initiate_load('load_results')

        @app.route("/alive")
        def alive() -> tuple[Response, int]:
            # If we are running, then we report that we are alive.
            return jsonify("alive"), 200

        @app.route("/initialized")
        def initialized() -> tuple[Response, int]:
            if app_state.get_state() == 'loaded':
                return jsonify("loaded")
            else:
                return jsonify("not loaded")

        @app.route("/load", methods=['POST'])
        def load() -> tuple[Response, int]:
            extract_zip(request.files.get('zipfile', None))
            return initiate_load('load_results')

        @app.route("/reload", methods=['POST'])
        def reload() -> tuple[Response, int]:
            extract_zip(request.files.get('zipfile', None))
            return initiate_reload('load_results')

        @app.route("/result")
        def result() -> Response:
            # get any partial log output in the queue with the queue listener
            partial_log_stream = StringIO()
            handler = logging.StreamHandler(partial_log_stream)
            listener = logging.handlers.QueueListener(log_queue, handler)
            formatter = logging.Formatter('[%(levelname)s] %(message)s')
            handler.setFormatter(formatter)
            handler.setLevel(logging.DEBUG)
            listener.start()
            listener.stop()

            # send current state plus partial log
            if not executor.futures.done('load_results'):
                return jsonify({
                    'status':
                    executor.futures._state('load_results'),
                    'partial_result':
                    partial_log_stream.getvalue(),
                    'result':
                    ''
                })

            # get final state, any remaining partial log, and the final log
            future = executor.futures.pop('load_results')
            success, log_output = future.result()
            return jsonify({
                'status': 'FINISHED',
                'successful': success,
                'partial_result': partial_log_stream.getvalue(),
                'result': log_output
            })

        @app.route("/service-internal-state")
        def service_state() -> dict:
            return app_state.as_dict()

        @app.errorhandler(404)
        def not_found_error(error: int) -> tuple[str, int]:
            return '404 error', 404

    return app


def environment_bool(name: str) -> bool:
    value = os.environ.get(name, 'false').lower()
    return not (
        value == '0' or value == 'false'
    )  # Consider *anything* except '0' or 'false' to be True


def valid_override_path(path: str) -> bool:
    "Ensure that the override path won't overwrite any system"
    "directories (to appease Fortify)"
    dangerous_paths = ["/etc", "/usr", "/bin", "/sbin", "/dev"]
    for p in dangerous_paths:
        if path.startswith(p):
            logger.error(
                f"Specified CONFIG_OVERRIDE_PATH '{path}' would overwrite "
                "system files. Ignoring overrides..."
            )
            return False
    return True


def extract_zip(zip_buffer) -> None:
    if zip_buffer is not None and valid_override_path(
        current_app.config["OVERRIDE_CONFIG_PATH"]
    ):
        logger.info('Override zipfile received, unzipping...')
        # Clear the previous overrides
        if os.path.exists(current_app.config["OVERRIDE_CONFIG_PATH"]):
            shutil.rmtree(current_app.config["OVERRIDE_CONFIG_PATH"])

        with zipfile.ZipFile(zip_buffer, "r") as zip_file:
            zip_file.extractall(current_app.config["OVERRIDE_CONFIG_PATH"])
        logger.info('Override unziped successfully')
