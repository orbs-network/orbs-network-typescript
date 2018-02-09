#!/bin/bash -e

npm link ../../architecture

npm install --unsafe-perm grpc@1.9.0 # Needs unsafe permissions to install node grpc extensions
npm install
npm run build
