#pragma once

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>

typedef void *address_t;

// Initializes the Crypto SDK. This method have to be called before using any of the underlying functions.
int crypto_init();

// Initializes the Crypto SDK in FIPS140-2 mode. This method have to be called before using any of the underlying functions.
int crypto_init_fips_mode();

// Creates a new address from a public key.
int crypto_address_create(uint8_t public_key[], uint8_t public_key_size, address_t *a);

// Frees an address.
void crypto_address_free(address_t *a);

// Converts an address to string.
int crypto_address_to_string(address_t a, char *str, uint8_t len);

#ifdef __cplusplus
}
#endif
