# Block Storage

## Motivation

The Block Storage holds incremental long-term storage used to generate the state (all past closed blocks).

## LevelDB

The Block Storage is currently implemented using LevelDB.

LevelDB is a fast key-value storage library written at Google that provides an ordered mapping from string keys to string values.

### Features

* Keys and values are arbitrary byte arrays.
* Data is stored sorted by key.
* Callers can provide a custom comparison function to override the sort order.
* The basic operations are `Put(key,value)`, `Get(key)`, `Delete(key)`.
* Multiple changes can be made in one atomic batch.
* Users can create a transient snapshot to get a consistent view of data.
* Forward and backward iteration is supported over the data.
* Data is automatically compressed using the [Snappy compression library](http://google.github.io/snappy/).
* External activity (file system operations etc.) is relayed through a virtual interface so users can customize the operating system interactions.

### Documentation

[LevelDB library documentation](https://github.com/google/leveldb/blob/master/doc/index.md) is online and bundled with the source code.

### Limitations

* This is not a SQL database. It does not have a relational data model, it does not support SQL queries, and it has no support for indexes.
* Only a single process (possibly multi-threaded) can access a particular database at a time.
* There is no client-server support builtin to the library.  An application that needs such support will have to wrap their own server around the library.

## Scheme

Each node's DB is stored at `db/[ENVIRONMENT]/blocks_[NODE].db` (e.g., `db/test/blocks_node4.db`).

The data is currently using following scheme:

* The ID of the last block is stored and updated under the `last` key.
* Every block is stored under its ID key.
