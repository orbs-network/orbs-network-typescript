#!/bin/bash -e

yarn link orbs-interfaces

yarn install

yarn run build

yarn link
