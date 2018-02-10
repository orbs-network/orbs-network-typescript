FROM node:9-alpine

RUN apk --no-cache add bash git yarn python build-base
# last two enable gyp-rebuild for secp256k1

VOLUME [ "/opt/orbs/logs" ]

ADD . /opt/orbs

WORKDIR /opt/orbs

RUN yarn global install typescript@2.7.1

RUN ./install.sh

RUN find . -name yarn.lock -delete

RUN ./build.sh

RUN cd e2e && ./build.sh

CMD echo
