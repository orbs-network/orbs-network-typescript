#!/bin/bash -e

apt-get update
apt-get install -y git-core build-essential curl pkg-config file unzip default-jdk
apt-get clean

# Install CMake
curl https://cmake.org/files/v3.10/cmake-3.10.2-Linux-x86_64.sh --output cmake-bootstrap && \
    bash cmake-bootstrap --skip-license --prefix=/usr && rm cmake-bootstrap

SDK_HOME="/opt"

# Install Gradle
GRADLE_VERSION="4.6"
GRADLE_SDK_URL="https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip"
curl -sSL "${GRADLE_SDK_URL}" -o gradle-bin.zip
unzip gradle-bin.zip -d ${SDK_HOME}
rm -rf gradle-bin.zip

export GRADLE_HOME="${SDK_HOME}/gradle-${GRADLE_VERSION}"
export PATH="${GRADLE_HOME}/bin:$PATH"

# Install Android SDK
ANDROID_TARGET_SDK="android-27"
ANDROID_SDK_TOOLS="27.0.3"
ANDROID_SDK_URL="https://dl.google.com/android/repository/build-tools_r${ANDROID_SDK_TOOLS}-linux.zip"
ANDROID_BUILD_TOOLS="build-tools-27.0.3"
export ANDROID_HOME="${SDK_HOME}/Android/sdk"

mkdir -p ${ANDROID_HOME}
curl -sSL ${ANDROID_SDK_URL} -o android-sdk.zip
unzip android-sdk.zip -d ${ANDROID_HOME}
rm -rf android-sdk.zip

export PATH="${ANDROID_HOME}/tools:${ANDROID_HOME}/platform-tools:$PATH"

# Install Android CMake
ANDROID_CMAKE_VERSION="3.6.4111459"
ANDROID_CMAKE_URL="https://dl.google.com/android/repository/cmake-${ANDROID_CMAKE_VERSION}-linux-x86_64.zip"

curl -sSL ${ANDROID_CMAKE_URL} -o android-cmake.zip
unzip android-cmake.zip -d ${ANDROID_HOME}/cmake
rm -rf android-cmake.zip

export PATH="${PATH}:${ANDROID_HOME}/cmake/bin"
chmod u+x ${ANDROID_HOME}/cmake/bin/ -R

# Install Android NDK
ANDROID_NDK_VERSION="r16b"
ANDROID_NDK_URL="https://dl.google.com/android/repository/android-ndk-${ANDROID_NDK_VERSION}-linux-x86_64.zip"

curl -sSL "${ANDROID_NDK_URL}" -o android-ndk-linux-x86_64.zip
unzip android-ndk-linux-x86_64.zip -d "${SDK_HOME}/ndk-bundle"
rm -rf android-ndk-linux-x86_64.zip

export ANDROID_NDK_HOME="${SDK_HOME}/ndk-bundle"
export PATH="${ANDROID_NDK_HOME}:$PATH"
chmod u+x ${ANDROID_NDK_HOME}/ -R
