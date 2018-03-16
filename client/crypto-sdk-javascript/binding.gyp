{
    "targets": [
        {
            "target_name": "cryptosdk",
            "sources": [
                "src/address.cpp",
                "src/crypto-sdk.cpp"
            ],
            "libraries": [
                "../../crypto-sdk/build/lib/libcrypto.a",
                "../../crypto-sdk/build/lib/libgcrypt-prefix/src/libgcrypt-build/src/.libs/libgcrypt.a",
                "../../crypto-sdk/build/lib/libgpg-error-prefix/src/libgpg-error-build/src/.libs/libgpg-error.a"
            ]
        }
    ]
}
