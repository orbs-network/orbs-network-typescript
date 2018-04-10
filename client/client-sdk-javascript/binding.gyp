{
    "targets": [
        {
            "target_name": "cryptosdk",
            "sources": [
                "src/ed25519key.cpp",
                "src/address.cpp",
                "src/crypto-sdk.cpp"
            ],
            "cflags_cc!": ["-static", "-std=c++11", "-stdlib=libc++"],
            "include_dirs": [
                "<(module_root_dir)/deps/",
                "<(module_root_dir)/deps/crypto-sdk/build/lib/libgcrypt-prefix/src/libgcrypt-build/src/"
            ],
            "libraries": [
                "<(module_root_dir)/deps/crypto-sdk/build/lib/libcrypto.a",
                "<(module_root_dir)/deps/crypto-sdk/build/lib/libgcrypt-prefix/src/libgcrypt-build/src/.libs/libgcrypt.a",
                "<(module_root_dir)/deps/crypto-sdk/build/lib/libgpg-error-prefix/src/libgpg-error-build/src/.libs/libgpg-error.a"
            ]
        }
    ]
}
