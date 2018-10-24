/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
global._   = require('lodash');
global.log = require('loglevel');

const chai = require('chai');
chai.config.includeStack = true;

const { expect }         = chai;
const should         = chai.should();
const Sinon          = require('sinon');

const requireModel = name => require(`${__dirname}/../src/code/models/${name}`);

const Relationship = requireModel("relationship");

describe("relationship", function() {
  it("should exists", () => Relationship.should.exist);

  describe("the constructor", function() {
    beforeEach(function() {
      return this.arguments = {};});
    return describe("using the defaults", () =>
      it("should make an undefined relationship", function() {
        const undertest = new Relationship(this.arguments);
        undertest.isDefined.should.equal(false);
        expect(undertest.text).to.be.undefined;
        return expect(undertest.formula).to.be.undefined;
      })
    );
  });

  return describe("evaluate", function() {
    describe("a simple formula", function() {
      beforeEach(function() {
        this.inFormula = "2 * in ^ 2 + out";
        this.arguments = {formula: this.inFormula};
        return this.undertest = new Relationship(this.arguments);
      });

      it("should be defined", function() {
        return this.undertest.isDefined.should.equal(true);
      });

      it("should do the math correctly", function() {
        this.undertest.evaluate(2,2).should.equal(10);
        this.undertest.evaluate(2,1).should.equal(9);
        return this.undertest.evaluate(1,1).should.equal(3);
      });

      return it("should not have errors", function() {
        return this.undertest.hasError.should.be.false;
      });
    });

    describe("a formula with an error", function() {
      beforeEach(function() {
        this.inFormula = "x +-+- 2 * in ^ 2";
        this.arguments = {formula: this.inFormula};
        return this.undertest = new Relationship(this.arguments);
      });

      it("should return a magic error number", function() {
        return this.undertest.evaluate(2,2).should.equal(Relationship.errValue);
      });

      return it("should indicate an error", function() {
        return this.undertest.hasError.should.be.true;
      });
    });

    return describe("a custom relationship", function() {
      beforeEach(function() {
        this.customData = [[0,5],[1,16],[2,11],[3,16]];
        this.arguments = {customData: this.customData};
        return this.undertest = new Relationship(this.arguments);
      });

      it("should retrieve a point via lookup", function() {
        return this.undertest.evaluate(3,0).should.equal(16);
      });

      it("should handle out-of-range lookups", function() {
        return this.undertest.evaluate(5,0).should.equal(0);
      });

      return it("should handle non-integer lookups via rounding", function() {
        return this.undertest.evaluate(2.9,0).should.equal(16);
      });
    });
  });
});