#!/bin/bash

set -ex

SCRIPT_PATH=$( cd $( dirname "${BASH_SOURCE[0]}" ) > /dev/null && pwd)
CONFIG_PATH="${SCRIPT_PATH}/../../config"
PYTHON_PATH="${SCRIPT_PATH}/.."

# Copy the contents of the config directory from gms-common to the current directory
if [ ! -d "_config" ]; then mkdir "_config"; fi
cp -r ${CONFIG_PATH}/* _config

# Copy dependent python libraries to a local python directory
if [ ! -d "_python" ]; then mkdir "_python"; fi
cp -r ${PYTHON_PATH}/gms-data-loader _python
