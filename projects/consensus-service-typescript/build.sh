#!/usr/bin/env bash -e

npm link ../common-library-typescript
npm install
npm run build
