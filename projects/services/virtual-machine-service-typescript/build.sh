#!/bin/bash -e

npm link ../../libs/common-library-typescript
npm link ../../libs/virtual-machine-library-typescript

npm install
npm run build
