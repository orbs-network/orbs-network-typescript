export namespace JsonBuffer {
  export function parseJsonWithBuffers(json: any) {
    return JSON.parse(json, (k, v) => {
      // support parsing back to a Buffer object
      if (v !== null && typeof v === "object" && "type" in v && v.type === "Buffer" && "data" in v && Array.isArray(v.data)) {
        return new Buffer(v.data);
      }
      return v;
    });
  }
}

