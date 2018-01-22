#!/usr/bin/env bash -e

npm link ../architecture
# needs unsafe permissions to install node grpc extensions
npm install --unsafe-perm grpc@1.8.4
npm install
npm run build
