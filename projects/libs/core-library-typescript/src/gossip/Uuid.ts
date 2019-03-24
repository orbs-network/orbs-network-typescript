/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const uuidJs = require("uuid-js");

export class Uuid {
  buffer: Buffer;
  str: string;

  private constructor(buffer: Buffer, str: string) {
    if (buffer) {
      this.buffer = new Buffer(buffer);
      this.str = uuidJs.fromBytes(buffer).toString();
    }
    else if (str) {
      const uuid = uuidJs.fromURN(str);
      this.buffer = new Buffer(uuid.toBytes());
      this.str = uuid.toString();
    }
    else {
      const uuid = uuidJs.create();
      this.buffer = new Buffer(uuid.toBytes());
      this.str = uuid.toString();
    }
  }

  static fromString(str: string) {
    return new Uuid(undefined, str);
  }

  static fromBuffer(buf: Buffer) {
    return new Uuid(buf, undefined);
  }

  static create() {
    return new Uuid(undefined, undefined);
  }

  public toString(): string {
    return this.str;
  }
}

export const EMPTY_UUID = Uuid.fromBuffer(new Buffer(16));

