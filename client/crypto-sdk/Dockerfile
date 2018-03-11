FROM ubuntu:18.04

ADD . /opt/orbs/client/crypto-sdk

WORKDIR /opt/orbs/client/crypto-sdk

RUN apt-get update && apt-get install -y build-essential git-core curl libgpg-error-dev && apt-get clean

RUN curl https://cmake.org/files/v3.11/cmake-3.11.0-rc3-Linux-x86_64.sh --output cmake-bootstrap && \
    bash cmake-bootstrap --skip-license --prefix=/usr && rm cmake-bootstrap

RUN ./configure.sh

RUN ./build.sh

RUN ./test.sh
