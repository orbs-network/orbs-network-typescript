package com.orbs.cryptosdk;

public class Address implements AutoCloseable {
    // This is the "handle" to the underlying native instance.
    private long selfPtr;
    public final String virtualChainId;
    public final String networkId;

    public Address(String publicKey, String virtualChainId, String networkId) {
        this.virtualChainId = virtualChainId;
        this.networkId = networkId;

        init(publicKey, virtualChainId, networkId);
    }

    static {
        System.loadLibrary("cryptosdk-android");
    }

    public void close() {
        disposeNative();
    }

    private native void init(String publicKey, String virtualChainId, String networkId);
    private native void disposeNative();

    public native String getPublicKey();
    public native String toString();
}
