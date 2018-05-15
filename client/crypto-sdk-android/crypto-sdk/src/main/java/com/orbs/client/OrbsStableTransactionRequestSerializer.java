package com.orbs.client;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;

import java.lang.reflect.Type;

public class OrbsStableTransactionRequestSerializer implements JsonSerializer<OrbsAPISendTransactionRequest> {
  @Override
  public JsonElement serialize(OrbsAPISendTransactionRequest src, Type typeOfSrc, JsonSerializationContext context) {
    JsonObject headerObject = new JsonObject();
    headerObject.add("contractAddressBase58", context.serialize(src.header.contractAddressBase58));
    headerObject.add("senderAddressBase58", context.serialize(src.header.senderAddressBase58));
    headerObject.add("timestamp", context.serialize(src.header.timestamp));
    headerObject.add("version", context.serialize(src.header.version));
    JsonObject object = new JsonObject();
    object.add("header",headerObject);
    object.add("payload",context.serialize(src.payload));
    return object;
  }
}
