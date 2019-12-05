import * as chai from "chai";
chai.config.includeStack = true;

import { toFixedTrimmed } from "../src/code/utils/to-fixed-trimmed";

describe("toFixedTrimmed", () => {
  it("should leave non-trailing zeros", () => {
    toFixedTrimmed(1.23, 2).should.equal("1.23");
  });

  it("should remove trailing zeros and trailing decimals", () => {
    toFixedTrimmed(1.20, 2).should.equal("1.2");
    toFixedTrimmed(1.0, 2).should.equal("1");
  });
});
