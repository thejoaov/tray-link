#!/bin/bash
set -e
source "${REACT_NATIVE_PATH}/scripts/find-node-for-xcode.sh"
export PROJECT_ROOT="$PODS_ROOT/../../"
export CLI_PROJECT="$PROJECT_ROOT/../cli/"

cd $CLI_PROJECT
bun archive

cd $PROJECT_ROOT
bun update-cli
