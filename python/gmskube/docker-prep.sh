#!/bin/bash

set -ex

rsync -av --copy-links ../../deploy/ ./src/_deploy
