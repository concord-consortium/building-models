import * as chai from "chai";
chai.config.includeStack = true;

import { stepSize } from "../src/code/utils/step-size";

describe("stepSize", () => {
  it("should default to 1 for ranges larger than 100", () => {
    stepSize({min: 0, max: 101}).should.equal(1);
    stepSize({min: 0, max: 1000}).should.equal(1);
    stepSize({min: 0, max: 10000}).should.equal(1);
    stepSize({min: 0, max: 100000}).should.equal(1);
  });

  it("should use 1 for 0 to 100", () => {
    stepSize({min: 0, max: 100}).should.equal(1);
  });

  it("should use 0.1 for 0 to 10", () => {
    stepSize({min: 0, max: 10}).should.equal(0.1);
  });

  it("should use 0.01 for 0 to 1", () => {
    stepSize({min: 0, max: 1}).should.equal(0.01);
  });
});
