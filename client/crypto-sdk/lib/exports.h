#pragma once

#ifndef CRYPTO_EXPORT
#define CRYPTO_EXPORT __attribute__((visibility("default")))
#endif

#ifndef CRYPTO_NO_EXPORT
#define CRYPTO_NO_EXPORT __attribute__((visibility("hidden")))
#endif
