#!/bin/bash

conda env remove -y --name gms-python
conda env create -y --name gms-python --file environment.yml
conda env export --name gms-python --no-builds --channel conda-forge --override-channels | grep -v "prefix" > environment.lock.yml
