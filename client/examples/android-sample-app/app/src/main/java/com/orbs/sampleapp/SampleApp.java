/*
 * Copyright (C) 2016 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.orbs.sampleapp;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import com.orbs.cryptosdk.Address;

public class SampleApp extends AppCompatActivity {
    public static final String VIRTUAL_CHAIN_ID = "640ed3";
    public static final String TESTNET_NETWORK_ID = "T";
    public static final String MAINNET_NETWORK_ID = "M";

    private String networkId = TESTNET_NETWORK_ID;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_sample_app);
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
        Address address = new Address("publicKey", VIRTUAL_CHAIN_ID, this.networkId);
        TextView text = (TextView)findViewById(R.id.orbsAddressTextView);
        text.setText(address.toString());
    }

    static {
        //System.loadLibrary("hello-jni");
    }
}
