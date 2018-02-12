#!/bin/bash -e

yarn install

./build/typescript.sh

yarn link
