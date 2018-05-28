#!/bin/bash -e
apt-get update
apt-get install -y git-core build-essential curl pkg-config file unzip default-jdk libboost-all-dev python-pip
apt-get clean

# Install CMake
curl https://cmake.org/files/v3.10/cmake-3.10.2-Linux-x86_64.sh --output cmake-bootstrap && \
    bash cmake-bootstrap --skip-license --prefix=/usr && rm cmake-bootstrap

SDK_HOME=${SDK_HOME:-"/opt"}

if [ ! -z "$NO_ANDROID" ]; then
    echo "SKIPPING ANDROID SDK..."
    exit 0
fi

# Install Gradle
GRADLE_VERSION=${GRADLE_VERSION:-"4.6"}
GRADLE_SDK_URL="https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip"
export GRADLE_HOME="${SDK_HOME}/gradle-${GRADLE_VERSION}"

mkdir -p ${GRADLE_HOME}
curl -sSL "${GRADLE_SDK_URL}" -o gradle-bin.zip
unzip gradle-bin.zip -d ${SDK_HOME}
rm -rf gradle-bin.zip

export PATH="${GRADLE_HOME}/bin:${PATH}"

# Install Android SDK
ANDROID_TARGET_SDK=${ANDROID_TARGET_SDK:-"android-27"}
ANDROID_SDK_TOOLS=${ANDROID_SDK_TOOLS:-"3859397"}
ANDROID_BUILD_TOOLS=${ANDROID_BUILD_TOOLS:-"build-tools-27.0.3"}
ANDROID_SDK_TOOLS_URL="https://dl.google.com/android/repository/sdk-tools-linux-${ANDROID_SDK_TOOLS}.zip"
export ANDROID_HOME="${SDK_HOME}/Android/sdk"

mkdir -p ${ANDROID_HOME}
curl -sSL ${ANDROID_SDK_TOOLS_URL} -o android-sdk.zip
unzip android-sdk.zip -d ${ANDROID_HOME}
rm -rf android-sdk.zip

export PATH="${ANDROID_HOME}/tools:${ANDROID_HOME}/platform-tools:${PATH}"

# Accept all licences
yes | ${ANDROID_HOME}/tools/bin/sdkmanager --licenses

# Install Android NDK
ANDROID_NDK_VERSION=${ANDROID_NDK_VERSION:-"r16b"}
ANDROID_NDK_URL="https://dl.google.com/android/repository/android-ndk-${ANDROID_NDK_VERSION}-linux-x86_64.zip"

curl -sSL "${ANDROID_NDK_URL}" -o android-ndk-linux-x86_64.zip
unzip android-ndk-linux-x86_64.zip -d "${ANDROID_HOME}"
rm -rf android-ndk-linux-x86_64.zip

export ANDROID_NDK_HOME="${ANDROID_HOME}/ndk-bundle"
export PATH="${ANDROID_NDK_HOME}:${PATH}"
mv ${ANDROID_HOME}/android-ndk-${ANDROID_NDK_VERSION} ${ANDROID_NDK_HOME}
chmod u+x ${ANDROID_NDK_HOME}/ -R
