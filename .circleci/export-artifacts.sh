#!/bin/bash

aws s3 cp --recursive artifacts s3://orbs-config-staging/tmp/artifacts/$CIRCLE_SHA1/
