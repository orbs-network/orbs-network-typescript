#!/bin/bash
brew tap caskroom/cask
brew cask install android-sdk
brew install gradle
brew install cmake
yes | sdkmanager --licenses
sdkmanager "lldb;3.1"
sdkmanager "cmake;3.6.4111459"
sdkmanager "build-tools;27.0.3"
sdkmanager "ndk-bundle"
echo "sdk.dir=/usr/local/share/android-sdk" >> ./local.properties
