#!/bin/bash

conda env remove -y --name gms-sysconfig
conda env create -y --name gms-sysconfig --file environment.yml
conda env export --name gms-sysconfig --no-builds --channel conda-forge --override-channels | grep -v "prefix" > environment.lock.yml