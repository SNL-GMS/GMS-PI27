#!/bin/bash

while [[ $# -ge 1 ]]
do
    key="$1"
    case $key in
        -f) 
            FORCE="true"
            echo "Cleaning emcmake-build build directory";
            rm -rf emcmake-build
            ;;
        *)
            echo "Unexpected option $key"
            ;;
            esac
        shift
done

# clean; prepare folders for building 
rm -rf ../typescript/user-interface/packages/ui-wasm/src/ts/wasm/
rm -rf ../typescript/user-interface/packages/ui-wasm/lib/wasm/

mkdir -p emcmake-build
mkdir -p ../typescript/user-interface/packages/ui-wasm/src/ts/wasm
mkdir -p ../typescript/user-interface/packages/ui-wasm/lib/wasm


# build wasm
node --version
emcc --check
cd emcmake-build
emcmake cmake ..
emmake make

# copy over files to the typescript packages
cp -R wasm/* ../../typescript/user-interface/packages/ui-wasm/src/ts/wasm
cp -R wasm/* ../../typescript/user-interface/packages/ui-wasm/lib/wasm
