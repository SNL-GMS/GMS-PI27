#!/bin/bash

#set -eux

# ----------------------------------------------------------------------
# Docker build will use the directory containing this script as the
# build context for the nginx container.
#
# This script must be run prior to docker build to collect the various
# files that needed by the nginx container to this context.
# ----------------------------------------------------------------------

# Get the path to the directory containing this bash script.
# Then define other paths relative to this script directory.
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
GMS_HOME="$( cd "${SCRIPT_DIR}/../../../.." > /dev/null && pwd )"
