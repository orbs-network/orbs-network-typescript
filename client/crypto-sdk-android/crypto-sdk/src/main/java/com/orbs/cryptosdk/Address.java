package com.orbs.cryptosdk;

public class Address {
    // This is the "handle" to the underlying native instance.
    private long selfPtr;

    public Address(String publicKey, String virtualChainId, String networkId) {
        init(publicKey, virtualChainId, networkId);
    }

    static {
        System.loadLibrary("cryptosdk-android");
    }

    private native void init(String publicKey, String virtualChainId, String networkId);
    protected native void finalize();

    public native String getPublicKey();
    public native String toString();
}
