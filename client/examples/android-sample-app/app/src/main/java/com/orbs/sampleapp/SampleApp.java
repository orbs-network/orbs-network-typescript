package com.orbs.sampleapp;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import com.orbs.cryptosdk.CryptoSDK;
import com.orbs.cryptosdk.Address;
import com.orbs.cryptosdk.ED25519Key;

public class SampleApp extends AppCompatActivity {
    public static final String VIRTUAL_CHAIN_ID = "640ed3";
    public static final String TESTNET_NETWORK_ID = "T";
    public static final String MAINNET_NETWORK_ID = "M";

    private String networkId = TESTNET_NETWORK_ID;

    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_sample_app);

        CryptoSDK.initialize();
    }

    public void onGenerateNewAddressClick(View view) {
        generateAddress();
    }

    public void onRadioButtonTestnetClicked(View view) {
        this.networkId = TESTNET_NETWORK_ID;

        generateAddress();
    }

    public void onRadioButtonMainnetClicked(View view) {
        this.networkId = MAINNET_NETWORK_ID;

        generateAddress();
    }

    private void generateAddress() {
        try (ED25519Key key = new ED25519Key();
            Address address = new Address(key.getPublicKey(), VIRTUAL_CHAIN_ID, this.networkId)) {
            TextView text = findViewById(R.id.orbsAddressTextView);
            text.setText(address.toString());
        }
    }
}
