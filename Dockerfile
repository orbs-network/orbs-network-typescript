FROM node:9-slim

RUN apt-get update && apt-get install -y git python build-essential git-core curl pkg-config file && apt-get clean

RUN curl https://cmake.org/files/v3.10/cmake-3.10.2-Linux-x86_64.sh --output cmake-bootstrap && \
    bash cmake-bootstrap --skip-license --prefix=/usr && rm cmake-bootstrap

VOLUME [ "/opt/orbs/logs", "/opt/orbs/db" ]

# TODO: move to later stage, use cache for ts compiler & top level software

ADD package.json yarn.lock .yarnrc /opt/orbs/

WORKDIR /opt/orbs

RUN yarn config list && \
    yarn global add typescript@2.7.1 tslint@5.9.1 && \
    yarn install && yarn cache clean

ADD . /opt/orbs

RUN yarn run build && yarn cache clean

CMD echo
