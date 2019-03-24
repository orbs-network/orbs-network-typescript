/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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

