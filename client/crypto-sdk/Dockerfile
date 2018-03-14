FROM ubuntu:18.04

RUN apt-get update && apt-get install -y build-essential git-core curl pkg-config file rng-tools && apt-get clean

RUN curl https://cmake.org/files/v3.10/cmake-3.10.2-Linux-x86_64.sh --output cmake-bootstrap && \
    bash cmake-bootstrap --skip-license --prefix=/usr && rm cmake-bootstrap

ADD . /opt/orbs/client/crypto-sdk

WORKDIR /opt/orbs/client/crypto-sdk

# Make sure that /dev/random contains enough entropy to run the tests on systems without TRNG (such as CircleCI).
#
# Warning: Never do this on production systems, since you it's simply filling the kernel entropy pool with entropy
# coming from the kernel itself.
RUN rngd -o /dev/random -r /dev/urandom

RUN ./clean.sh

RUN ./configure.sh

RUN ./build.sh

RUN ./test.sh
