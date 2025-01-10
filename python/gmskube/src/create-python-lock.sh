#!/bin/bash

conda env remove -y --name gmskube
conda env create -y --name gmskube --file environment.yml
conda env export --name gmskube --no-builds --channel conda-forge --override-channels | grep -v "prefix" > environment.lock.yml