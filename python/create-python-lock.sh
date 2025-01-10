#!/bin/bash

conda env remove -y --name gms
conda env create -y --name gms --file gms-test-environment.yml
conda env export --name gms --no-builds --channel conda-forge --override-channels | grep -v "prefix" > gms-test-environment.lock.yml
