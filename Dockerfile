FROM node:9-stretch

ARG CI
ENV CI=$CI

VOLUME [ "/opt/orbs/logs", "/opt/orbs/db" ]

# TODO: move to later stage, use cache for ts compiler & top level software

ADD package.json yarn.lock .yarnrc docker/bootstrap-*.sh docker/install*.sh /opt/orbs/

WORKDIR /opt/orbs

ENV SDK_HOME="/opt"
ENV GRADLE_VERSION="4.6"
ENV ANDROID_TARGET_SDK="android-27"
ENV ANDROID_SDK_TOOLS="3859397"
ENV ANDROID_BUILD_TOOLS="build-tools-27.0.3"
ENV ANDROID_NDK_VERSION="r16b"

ENV GRADLE_HOME="${SDK_HOME}/gradle-${GRADLE_VERSION}"
ENV ANDROID_HOME="${SDK_HOME}/Android/sdk"
ENV ANDROID_NDK_HOME="${ANDROID_HOME}/ndk-bundle"

RUN ./bootstrap-sdk.sh

ENV PATH="${GRADLE_HOME}/bin:${ANDROID_HOME}/tools:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/cmake/bin:${ANDROID_NDK_HOME}:${PATH}"

RUN ./bootstrap-server.sh

RUN yarn config list && \
    yarn global add typescript@2.7.1 tslint@5.9.1 && \
    yarn install && yarn cache clean

ADD . /opt/orbs

RUN yarn run build && yarn cache clean

CMD echo
