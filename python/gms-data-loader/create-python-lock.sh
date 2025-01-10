#!/bin/bash

conda env remove -y --name gms-data-loader
conda env create -y --name gms-data-loader --file environment.yml
conda env export --name gms-data-loader --no-builds --channel conda-forge --override-channels | grep -v "prefix" > environment.lock.yml
