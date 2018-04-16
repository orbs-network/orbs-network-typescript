#!/bin/bash -e

export PROJECT_TYPE=${PROJECT_TYPE-server}

yarn install

yarn run build
