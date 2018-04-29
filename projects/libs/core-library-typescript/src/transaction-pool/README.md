# Transaction Pool

## What the transaction pool does

1. Storing transactions that are pending insertion to a block
2. Preventing transaction de-duplication

## Lifecycle of a transaction in the pool

1. A new transaction is sent by a client to an Orbs node, added to its pool as well as broadcast to other nodes.
2. Pending transactions are frequently added together to build the next block.
3. Every time a block is committed, it reports back to the transaction pool to remove the committed transactions from the pending pool and move them to another pool of committed transactions.
4. Expired transactions are periodically cleaned up from both pools

## Transaction de-duplication mechanism

Two transactions are considered duplicate if both their headers and bodies are fully identical.
The de-dup prevention mechanism works by checking the hash of a transaction, such that in case a transaction is already in the pool (either the pending or committed pool), another transaction with the same hash will be dropped and therefore will never be committed to a future block. Transactions have a "time to live", derived by the timestamp of the transaction, which, if passed, expires and removed from the pool. This is an optimization feature that prevents infinite growth of the pool storage.

The de-duplication and all transaction pool management is done via the transaction pool service, which instruments the committed and pending transaction pools. Pending transaction pool also denies duplicate direct additions.
