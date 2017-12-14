#!/usr/bin/env bash

mkdir -p ./dist

./node_modules/protobufjs/bin/pbjs \
  -p ./node_modules/protobufjs \
  -t json \
  ./interfaces/*.proto > \
  ./dist/protos.json

node ./build/src/ts-index.js > ./dist/index.js

node ./build/src/ts-index-d.js > ./dist/index.d.ts

echo
echo "Done generating TypeScript types from *.proto"
echo
