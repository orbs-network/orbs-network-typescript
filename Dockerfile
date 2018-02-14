FROM node:9-alpine

RUN apk --no-cache add bash git yarn python build-base

VOLUME [ "/opt/orbs/logs" ]

# TODO: move to later stage, use cache for ts compiler & top level software

ADD package.json yarn.lock .yarnrc /opt/orbs/

WORKDIR /opt/orbs

RUN yarn config list && \
    yarn global add typescript@2.7.1 tslint@5.9.1 && \
    yarn install && yarn cache clean

ADD . /opt/orbs

RUN yarn run build && yarn cache clean

RUN cd e2e && ./build.sh && yarn cache clean

CMD echo
