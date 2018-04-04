package com.orbs.cryptosdk;

public class Address {
    private String address;

    public Address(String publicKey, String virtualChainId, String networkId) {
        this.address = networkId.equals("M") ? "M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFsJu1" : "T1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFsJu1";
    }

    public String toString() {
        return this.address;
    }
}
