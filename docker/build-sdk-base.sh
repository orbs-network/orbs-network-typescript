#!/bin/bash

docker build --build-arg NO_ANDROID=$NO_ANDROID -t orbs:base-sdk -f Dockerfile.sdk.base .
