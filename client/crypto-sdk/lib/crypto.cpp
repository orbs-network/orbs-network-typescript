#include "crypto.h"

#include <gcrypt.h>
#include <stdexcept>
#include <string>

using namespace std;
using namespace Orbs;

static const uint SECMEM_SIZE = 16384;

void CryptoSDK::Init() {
    if (!gcry_check_version(GCRYPT_VERSION)) {
        throw runtime_error("libgcrypt version mismatch!");
    }

    // We don’t want to see any warnings, e.g. because we have not yet parsed program options which might be used to
    // suppress such warnings.
    gcry_error_t err;
    if ((err = gcry_control(GCRYCTL_SUSPEND_SECMEM_WARN))) {
        throw runtime_error("Failed to initialize GCRYCTL_SUSPEND_SECMEM_WARN with: " + to_string(err));
    }

    // Allocate a pool of 16k secure memory. This makes the secure memory available and also drops privileges where
    // needed. Note that by using functions like gcry_xmalloc_secure and gcry_mpi_snew Libgcrypt may expand the secure
    // memory pool with memory which lacks the property of not being swapped out to disk.
    if ((err = gcry_control(GCRYCTL_INIT_SECMEM, SECMEM_SIZE, 0))) {
        throw runtime_error("Failed to initialize GCRYCTL_INIT_SECMEM with: " + to_string(err));
    }

    // It is now okay to let Libgcrypt complain when there was/is a problem with the secure memory.
    if ((err = gcry_control(GCRYCTL_RESUME_SECMEM_WARN))) {
        throw runtime_error("Failed to initialize GCRYCTL_RESUME_SECMEM_WARN with: " + to_string(err));
    }

    // Tell Libgcrypt that initialization has completed.
    if ((err = gcry_control(GCRYCTL_INITIALIZATION_FINISHED, 0))) {
        throw runtime_error("Failed to initialize GCRYCTL_INITIALIZATION_FINISHED with: " + to_string(err));
    }
}
