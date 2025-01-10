#!/bin/bash

conda env remove -y --name config-loader
conda env create -y --name config-loader --file environment.yml
conda env export --name config-loader --no-builds --channel conda-forge --override-channels | grep -v "prefix" > environment.lock.yml
