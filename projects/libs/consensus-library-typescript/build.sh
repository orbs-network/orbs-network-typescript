#!/bin/bash -e

npm link ../common-library-typescript
npm link ../gossip-library-typescript

npm install

npm run build
