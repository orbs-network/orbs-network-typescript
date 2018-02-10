#!/bin/bash -e

npm link ../../libs/common-library-typescript
npm link ../../libs/consensus-library-typescript
npm link ../../libs/gossip-library-typescript
npm link ../../libs/transaction-pool-library-typescript
npm link ../../libs/subscription-manager-library-typescript

npm install
npm run build
