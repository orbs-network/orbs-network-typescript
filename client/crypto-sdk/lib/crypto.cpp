#include "crypto.h"

#include <gcrypt.h>
#include <stdexcept>
#include <string>

using namespace std;
using namespace Orbs;

static const uint SECMEM_SIZE = 16384;

// Initializes the Crypto SDK. This method have to be called before using any of the underlying functions.
void CryptoSDK::Init() {
    if (!gcry_check_version(GCRYPT_VERSION)) {
        throw runtime_error("libgcrypt version mismatch!");
    }

    // We don’t want to see any warnings, e.g. because we have not yet parsed program options which might be used to
    // suppress such warnings.
    gcry_error_t err;
    if ((err = gcry_control(GCRYCTL_SUSPEND_SECMEM_WARN))) {
        throw runtime_error("Failed to send GCRYCTL_SUSPEND_SECMEM_WARN with: " + to_string(err));
    }

    // Allocate a pool of 16k secure memory. This makes the secure memory available and also drops privileges where
    // needed. Note that by using functions like gcry_xmalloc_secure and gcry_mpi_snew Libgcrypt may expand the secure
    // memory pool with memory which lacks the property of not being swapped out to disk.
    if ((err = gcry_control(GCRYCTL_INIT_SECMEM, SECMEM_SIZE, 0))) {
        throw runtime_error("Failed to send GCRYCTL_INIT_SECMEM with: " + to_string(err));
    }

    // It is now okay to let Libgcrypt complain when there was/is a problem with the secure memory.
    if ((err = gcry_control(GCRYCTL_RESUME_SECMEM_WARN))) {
        throw runtime_error("Failed to send GCRYCTL_RESUME_SECMEM_WARN with: " + to_string(err));
    }

    // Tell Libgcrypt that initialization has completed.
    if ((err = gcry_control(GCRYCTL_INITIALIZATION_FINISHED, 0))) {
        throw runtime_error("Failed to send GCRYCTL_INITIALIZATION_FINISHED with: " + to_string(err));
    }
}

// Initializes the Crypto SDK in FIPS140-2 mode. This method have to be called before using any of the underlying functions.
void CryptoSDK::InitFIPSMode() {
    gcry_error_t err;
    if ((err = gcry_control(GCRYCTL_FORCE_FIPS_MODE))) {
        throw runtime_error("Failed to send GCRYCTL_FORCE_FIPS_MODE with: " + to_string(err));
    }

    if ((err = gcry_control(GCRYCTL_SET_ENFORCED_FIPS_FLAG))) {
        throw runtime_error("Failed to send GCRYCTL_SET_ENFORCED_FIPS_FLAG with: " + to_string(err));
    }

    if ((err = gcry_control(GCRYCTL_SELFTEST))) {
        throw runtime_error("Failed to send GCRYCTL_SELFTEST with: " + to_string(err));
    }

    Init();
}
