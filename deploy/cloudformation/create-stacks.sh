#!/bin/bash -e

rm -rf tmp
mkdir -p tmp

# Set this variable to temporarily disable deployment on circle ci
[ -z "$DISABLE_DEPLOYMENT" ] && node create-stacks.js $@
exit $?
