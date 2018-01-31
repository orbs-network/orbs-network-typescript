#!/bin/bash -e

rm -rf tmp
mkdir -p tmp

node create-stacks.js $@