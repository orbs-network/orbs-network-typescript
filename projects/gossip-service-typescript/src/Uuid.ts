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

