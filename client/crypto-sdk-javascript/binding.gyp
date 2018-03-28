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
                "<(module_root_dir)/deps/crypto-sdk/build/libgcrypt/include/"
            ],
            "libraries": [
                "<(module_root_dir)/deps/crypto-sdk/build/libgpg-error/lib/libgpg-error.a",
                "<(module_root_dir)/deps/crypto-sdk/build/libgcrypt/lib/libgcrypt.a",
                "<(module_root_dir)/deps/crypto-sdk/build/lib/libcrypto.a"
            ]
        }
    ]
}
