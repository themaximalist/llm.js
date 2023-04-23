#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

for file in $SCRIPT_DIR/*.js; do
    echo "Running $(basename $file)...";
    node $file;
    echo "";
    echo "";
done
