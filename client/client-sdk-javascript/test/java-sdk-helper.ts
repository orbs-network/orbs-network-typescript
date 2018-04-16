const java = require("java");
java.options.push("-Djava.library.path=../crypto-sdk-android/crypto-sdk/build/outputs/jar/");
java.classpath.push("../crypto-sdk-android/crypto-sdk/build/outputs/jar/crypto-sdk-release.jar");

export default java;
