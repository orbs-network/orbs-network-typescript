package com.orbs.cryptosdk;

public class CryptoSDK {
    public CryptoSDK() {
    }

    static public void initialize() {
        init();
    }

    static {
        System.loadLibrary("cryptosdk-android");
    }

    private static native void init();
}
