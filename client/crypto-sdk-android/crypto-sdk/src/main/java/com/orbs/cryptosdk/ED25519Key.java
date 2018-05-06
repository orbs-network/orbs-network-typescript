package com.orbs.cryptosdk;

public class ED25519Key {
    // This is the "handle" to the underlying native instance.
    private long selfPtr;

    public ED25519Key(String publicKey) {
        init(publicKey);
    }

    public ED25519Key(String publicKey, String privateKey) {
        init(publicKey, privateKey);
    }

    public ED25519Key() {
        init();
    }

    static {
        System.loadLibrary("cryptosdk-android");
    }

    private native void init(String publicKey);
    private native void init(String publicKey, String privateKey);
    private native void init();
    protected native void finalize();

    public native String getPublicKey();
    public native String getPrivateKeyUnsafe();
    public native boolean hasPrivateKey();

    public native byte[] sign(byte[] message);
    public native boolean verify(byte[] message, byte[] signature);
}
