#!/bin/bash -e

npm link ../common-library-typescript
npm link ../block-storage-library-typescript

npm install
npm run build
