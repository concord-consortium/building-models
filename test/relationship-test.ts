import * as chai from "chai";
chai.config.includeStack = true;

const { expect } = chai;

import { Relationship } from "../src/code/models/relationship";

describe("relationship", () => {
  it("should exists", () => Relationship.should.exist);

  describe("the constructor", () => {
    beforeEach(() => {
      this.arguments = {};
    });
    describe("using the defaults", () =>
      it("should make an undefined relationship", () => {
        const undertest = new Relationship(this.arguments);
        undertest.isDefined.should.equal(false);
        // WAS: expect(undertest.text).to.be.undefined();
        expect(undertest.text).to.equal(undefined);
        // WAS: expect(undertest.formula).to.be.undefined();
        expect(undertest.formula).to.equal(undefined);
      })
    );
  });

  describe("evaluate", () => {
    describe("a simple formula", () => {
      beforeEach(() => {
        this.inFormula = "2 * in ^ 2 + out";
        this.arguments = {formula: this.inFormula};
        this.undertest = new Relationship(this.arguments);
      });

      it("should be defined", () => {
        this.undertest.isDefined.should.equal(true);
      });

      it("should do the math correctly", () => {
        this.undertest.evaluate(2, 2).should.equal(10);
        this.undertest.evaluate(2, 1).should.equal(9);
        this.undertest.evaluate(1, 1).should.equal(3);
      });

      it("should not have errors", () => {
        this.undertest.hasError.should.be.false();
      });
    });

    describe("a formula with an error", () => {
      beforeEach(() => {
        this.inFormula = "x +-+- 2 * in ^ 2";
        this.arguments = {formula: this.inFormula};
        this.undertest = new Relationship(this.arguments);
      });

      it("should return a magic error number", () => {
        this.undertest.evaluate(2, 2).should.equal(Relationship.errValue);
      });

      it("should indicate an error", () => {
        this.undertest.hasError.should.be.true();
      });
    });

    describe("a custom relationship", () => {
      beforeEach(() => {
        this.customData = [[0, 5], [1, 16], [2, 11], [3, 16]];
        this.arguments = {customData: this.customData};
        this.undertest = new Relationship(this.arguments);
      });

      it("should retrieve a point via lookup", () => {
        this.undertest.evaluate(3, 0).should.equal(16);
      });

      it("should handle out-of-range lookups", () => {
        this.undertest.evaluate(5, 0).should.equal(0);
      });

      it("should handle non-integer lookups via rounding", () => {
        this.undertest.evaluate(2.9, 0).should.equal(16);
      });
    });
  });
});
