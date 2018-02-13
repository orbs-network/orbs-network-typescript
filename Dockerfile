FROM node:9-alpine

RUN apk --no-cache add bash git yarn python build-base
# last two enable gyp-rebuild for secp256k1

VOLUME [ "/opt/orbs/logs" ]

# TODO: move to later stage, use cache for ts compiler & top level software

ADD package.json yarn.lock /opt/orbs/

WORKDIR /opt/orbs

RUN yarn global add typescript@2.7.1 && yarn install && yarn cache clean

ADD . /opt/orbs

RUN yarn run build && cd e2e && ./build.sh && yarn cache clean

CMD echo
