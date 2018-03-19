#!/bin/bash -e

apt-get update
apt-get install -y git-core build-essential curl pkg-config file
apt-get clean

curl https://cmake.org/files/v3.10/cmake-3.10.2-Linux-x86_64.sh --output cmake-bootstrap && \
    bash cmake-bootstrap --skip-license --prefix=/usr && rm cmake-bootstrap
