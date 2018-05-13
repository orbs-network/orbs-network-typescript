{
    "targets": [
        {
            "target_name": "cryptosdk",
            "sources": [
                "../client-sdk-javascript/src/ed25519key.cpp",
                "../client-sdk-javascript/src/address.cpp",
                "../client-sdk-javascript/src/crypto-sdk.cpp"
            ],
            "cflags_cc!": [
                "-static",
                "-std=c++11",
                "-stdlib=libc++"
            ],
            "include_dirs": [
                "<(module_root_dir)/deps/"
            ],
            "conditions": [
                ["OS=='mac'", {
                    "libraries": [
                        "-Wl,-rpath,<(module_root_dir)/deps/crypto-sdk/build/mac/lib/",
                        "<(module_root_dir)/deps/crypto-sdk/build/mac/lib/libcryptosdk.dylib"
                    ],
                    "xcode_settings": {
                        "OTHER_CPLUSPLUSFLAGS": [
                            "-static",
                            "-std=c++11",
                            "-stdlib=libc++"
                        ],
                        "OTHER_LDFLAGS": [
                            "-stdlib=libc++"
                        ],
                        "MACOSX_DEPLOYMENT_TARGET": "10.13",
                        "GCC_ENABLE_CPP_EXCEPTIONS": "YES"
                    }
                }],
                ["OS=='linux'", {
                    "libraries": [
                        "-Wl,-rpath,<(module_root_dir)/deps/crypto-sdk/build/linux/lib/",
                        "<(module_root_dir)/deps/crypto-sdk/build/linux/lib/libcryptosdk.so"
                    ],
                }]
            ]
        }
    ]
}
