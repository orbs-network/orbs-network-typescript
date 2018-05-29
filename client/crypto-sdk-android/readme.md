[ ![Download](https://api.bintray.com/packages/orbs/orbs-network/orbs-network/images/download.svg) ](https://bintray.com/orbs/orbs-network/orbs-network/_latestVersion)

Orbs Android SDK
===

Orbs Android SDK is a Java library that can be used in apps utilizing the orbs-network to access the network and call contracts data.

## SDK Goals

* To enable developers to simply call methods in their contracts over the orbs-network
* Support both Android apps and Java based applications/servers
* Provide a simplified interface for working with the basic crypto elements of the orbs-network

## Integrating the SDK

The package is available via `jcenter()` for download, add to your gradle file the following:
```gradle
dependencies {
    implementation 'com.orbs.sdk.cryptosdk:+'
}
```

### Other dependencies

The SDK uses `okhttp` for network access and `gson` for serialization.

## Orbs-Sample-App

Below you will find specific instructions on how to use the SDK, for each different function you will see there is also a sample implementaion in the orbs sample app that can be found here:
https://github.com/orbs-network/orbs-network/tree/master/client/examples/android-sample-app

Using the SDK 
---

The SDK exposes two main packages:

* `com.orbs.cryptosdk` - containing the native implementation of the cryptography related functions around address creation.
* `com.orbs.client` - containing the java implementation of the `OrbsContract` and `OrbsClient` to be used to call smart contract methods and run code over the orbs-network.

### OrbsContract and OrbsClient Explained
The Client gives you low level access to perform actions on the network - letting you call the orbs smart contract interface directly either run a contract method that would create a transaction, or query for information ('call').

The Contract wraps the client and gives another level of abstraction above the client, letting you using the methods of your contract directly. The Contract implementation is very abstract in nature, and in most cases you will be writing your own 'Contract' class according to your application needs.

## Initialization
At first, you are require to initialize the crypto engine by calling `CryptoSDK.initialize()`

```java
import com.orbs.cryptosdk.CryptoSDK;

public class SampleApp extends AppCompatActivity {

    private void someFunctionThatIsCalledBeforeOtherOrbs() {
        CryptoSDK.initialize();
    }

    ...
```

Not calling initialize may cause the SDK to become unstable and may cause issues with generating addresses and working with them, you may see several error/warning log messages being outputted if you miss the initialize call.

The client classes `OrbsContract` and `OrbsClient` are used to access and manipulate data on the orbs-network as explained above.

### Addresses

Next, to generate a new address you should call the following (using the `AutoCloseble` interface):
```java
private String generateAddress() {
        try (ED25519Key key = new ED25519Key();
            Address address = new Address(key.getPublicKey(), VIRTUAL_CHAIN_ID, NETWORK_ID)) {
            return address.toString();
        }
    }
```

Key generation time should take around 20-30ms but may sometime spike as the PRNG is waiting to collect enough entropy.

More information about the addressing scheme is available at the [client documentation](https://github.com/orbs-network/orbs-network/tree/master/client).

## The OrbsHost class

This class is used to provide the connection endpoint, it will receive three arguments which construct the connection info:

* `isHttps` - true/false for ssl
* `host` - the host address of the node to connect to, for example `my.app.orbs.network`
* `port` - the endpoint port, for example `80`

## The OrbsClient class

You can create an `OrbsClient` class to call the contract methods with some client (Address). The client will accept:

* `endpoint` - the orbs-network node repesented as a `OrbsHost` class
* `senderAddress` - the address of the entity 'acting' right now, its virtual chain must match the addressing scheme of the contract
* `keyPair` - the public and private key for the current sender, used to sign the message (`ED25519Key` object)
* `timeoutInMs` - optional network timeout, the default is 3000ms

Creating the client will enable you to perform two main operation, `sendTransaction()` and `call()`.

Both of these actions will accept two variables:

* `contractAddress` - the contract to use
* `payload` - a JSON object of the following schema:
  ```json
  {
    method: 'methodName',
    args: [ 'some-string', 3 ]
  }
  ```
  * `method` - a string value of the method to call
  * `args` - an array of args that can be either a string value or a number

### sendTransaction

Use `sendTransaction()` to perform an action (method of the smart contract) which changes the state such as a transfer action.

### call

Use `call()` to perform a 'query' operation, such as a getBalance() method in a smart contract.

## OrbsContract class

This class is used to wrap the client and simplify accessing the `sendTransaction` and `call`, creating a new `OrbsContract` will require to supply the following:

* `client` - the client used to access the network
* `contractName` - the contract name in the orbs-network to work with

With the contract class, the `sendTransaction` and `call` functions are exposed, and accept the following arguments:

* `methodName` - a string value of the method to call
* `args` - an object array that is expected to have string or int values.

Using the contract functions, it will automatically prepare the payload json and call the client as expected.

The OrbsContract class is very abstract in nature, it really just wraps the client for easier access to a specific smart contract name. In most use cases, it would make sense to either inherit from or copy the class and implement your application specific interface to simplify your work.