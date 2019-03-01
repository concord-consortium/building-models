import * as chai from "chai";
chai.config.includeStack = true;

const { expect } = chai;

import { Relationship, RelationshipOptions } from "../src/code/models/relationship";

describe("relationship", () => {
  let undertest: Relationship;
  let inFormula: string;
  let options: RelationshipOptions;

  it("should exists", () => Relationship.should.exist);

  describe("the constructor", () => {
    beforeEach(() => {
      options = {};
    });
    describe("using the defaults", () =>
      it("should make an undefined relationship", () => {
        undertest = new Relationship(options);
        undertest.isDefined.should.equal(false);
        expect(undertest.text).to.equal(undefined);
        expect(undertest.formula).to.equal(undefined);
      })
    );
  });

  describe("evaluate", () => {
    describe("a simple formula", () => {
      beforeEach(() => {
        inFormula = "2 * in ^ 2 + out";
        options = {formula: inFormula};
        undertest = new Relationship(options);
      });

      it("should be defined", () => {
        undertest.isDefined.should.equal(true);
      });

      it("should do the math correctly", () => {
        undertest.evaluate(2, 2).should.equal(10);
        undertest.evaluate(2, 1).should.equal(9);
        undertest.evaluate(1, 1).should.equal(3);
      });

      it("should not have errors", () => {
        expect(undertest.hasError).to.equal(false);
      });
    });

    describe("a formula with an error", () => {
      beforeEach(() => {
        inFormula = "x +-+- 2 * in ^ 2";
        options = {formula: inFormula};
        undertest = new Relationship(options);
      });

      it("should return a magic error number", () => {
        undertest.evaluate(2, 2).should.equal(Relationship.errValue);
      });

      it("should indicate an error", () => {
        expect(undertest.hasError).to.equal(true);
      });
    });

    describe("a custom relationship", () => {
      beforeEach(() => {
        this.customData = [[0, 5], [1, 16], [2, 11], [3, 16]];
        options = {customData: this.customData};
        undertest = new Relationship(options);
      });

      it("should retrieve a point via lookup", () => {
        undertest.evaluate(3, 0).should.equal(16);
      });

      it("should handle out-of-range lookups", () => {
        undertest.evaluate(5, 0).should.equal(0);
      });

      it("should handle non-integer lookups via rounding", () => {
        undertest.evaluate(2.9, 0).should.equal(16);
      });
    });
  });
});
