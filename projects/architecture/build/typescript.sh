#!/bin/bash -e

mkdir -p ./dist
mkdir -p ./intermediate
rm -rf ./dist/**

./node_modules/protobufjs/bin/pbjs \
  -p ./node_modules/protobufjs \
  -t json \
  ./interfaces/*.proto > \
  ./dist/protos.json

node ./build/src/ts-index.js > ./intermediate/index.ts
tsc -d

echo
echo "Done generating TypeScript types from *.proto"
echo
