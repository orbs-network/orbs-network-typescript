FROM node:9-alpine

RUN apk --no-cache add bash python build-base
# remove python and build-base when grpc-prebuilt will be up again

ADD . /opt/orbs

WORKDIR /opt/orbs

RUN npm install -g typescript@2.6.2

RUN ./install.sh

RUN find . -name package-lock.json -delete

RUN ./build.sh

CMD node simulate/src/index.js transaction-gossip