import "mocha";
import * as java from "java";

describe("java bindings", () => {
  it("loads classes from JDK", () => {
    java.import("java.lang.System").out.printlnSync("foobar");

  });
});
