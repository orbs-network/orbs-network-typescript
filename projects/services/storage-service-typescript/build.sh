#!/bin/bash -e

npm link ../../libs/common-library-typescript
npm link ../../libs/block-storage-library-typescript
npm link ../../libs/state-storage-library-typescript

npm install
npm run build
