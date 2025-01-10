#!/bin/bash

conda env remove -y --name builder
conda env create -y --name builder --file environment.yml
conda env export --name builder --no-builds --channel conda-forge --override-channels | grep -v "prefix" > environment.lock.yml