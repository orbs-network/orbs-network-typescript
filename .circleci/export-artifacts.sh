#!/bin/bash

aws s3 cp --recursive artifacts s3://orbs-network-config-staging/build/artifacts/$CIRCLE_SHA1/
