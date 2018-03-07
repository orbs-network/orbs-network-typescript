# Crypto SDK

Crypto SDK is a cross-platform C++ library (with ANSI C exported interfaces) that implements all the necessary cryptographic functions for Orbs clients.

In order to implement some of the functionality, we have elected to use libgcrypt, since it's:

1. Licensed under GNU LGPL v2.1+.
2. FIPS 140 validated.
3. Support FIPS 140-2 mode.

## Prerequisites

1. [CMake](https://cmake.org)

```bash
brew install cmake
```

## Build

> First, you'd need to run the `./configure.sh` script. It will configure the release build by default, but if you require a debug build, make sure to run it with the `DEBUG` environment variable set:

Release:

```bash
./configure.sh
```

Debug:

```bash
DEBUG=1 ./configure.sh
```

> After the project is configured, you'd need to run the `./build.sh` script:

```bash
./build.sh
```

## Test

> In order to run the tests, you'd need to run the `./test.sh` script:

```bash
./test.sh
```

## Libgcrypt
Libgcrypt is a general purpose cryptographic library originally based on code from GnuPG. It provides
functions for all cryptograhic building blocks: symmetric cipher algorithms (AES, Arcfour, Blowfish, Camellia,
CAST5, ChaCha20 DES, GOST28147, Salsa20, SEED, Serpent, Twofish) and modes (ECB,CFB,CBC,OFB,CTR,CCM,GCM,OCB,
POLY1305, AESWRAP), hash algorithms (MD2, MD4, MD5, GOST R 34.11, RIPE-MD160, SHA-1, SHA2-224, SHA2-256,
SHA2-384, SHA2-512, SHA3-224, SHA3-256, SHA3-384, SHA3-512, SHAKE-128, SHAKE-256, TIGER-192, Whirlpool), MACs
(HMAC for all hash algorithms, CMAC for all cipher algorithms, GMAC-AES, GMAC-CAMELLIA, GMAC-TWOFISH,
GMAC-SERPENT, GMAC-SEED, Poly1305, Poly1305-AES, Poly1305-CAMELLIA, Poly1305-TWOFISH, Poly1305-SERPENT,
Poly1305-SEED), public key algorithms (RSA, Elgamal, DSA, ECDSA, EdDSA, ECDH), large integer functions, random
numbers and a lot of supporting functions.
Libgcrypt works on most POSIX systems and many pre-POSIX systems. It can also be built using a cross-compiler
system for Microsoft Windows.
Libgcrypt can be used independently of GnuPG, but depends on its error-reporting library Libgpg-error.
