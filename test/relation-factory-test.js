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

const RelationFactory = requireModel("relation-factory");
const Relationship    = requireModel("relationship");

describe("RelationFactory", function() {
  beforeEach(function() {
    this.vector = RelationFactory.increase;
    return this.scalar = RelationFactory.aboutTheSame;
  });

  it("should exists", () => RelationFactory.should.exist);


  describe("fromSelections", () =>
    describe("increase aboutTheSame", function() {
      beforeEach(function() {
        return this.underTest = RelationFactory.fromSelections(this.vector,this.scalar);
      });

      it("should make a working relationship", function() {
        return this.underTest.hasError.should.be.false;
      });

      describe("the function", () =>
        it("should be `out + in`", function() {
          return this.underTest.formula.should.equal('1 * in');
        })
      );

      return describe("evaluating the function for out=1 and in=6", () =>
        it("should evaluate to 7", function() {
          return this.underTest.evaluate(6,1).should.equal(6);
        })
      );
    })
  );

  return describe("selectionsFromRelation", function() {
    describe("with an instanace of increase aboutTheSame", function() {
      beforeEach(function() {
        return this.relation = RelationFactory.fromSelections(this.vector, this.scalar);
      });

      return it("should return the correct selectors", function() {
        const selections = RelationFactory.selectionsFromRelation(this.relation);
        selections.vector.should.equal(RelationFactory.increase);
        return selections.scalar.should.equal(RelationFactory.aboutTheSame);
      });
    });

    return describe("with a randomish formula", function() {
      beforeEach(function() {
        return this.relation = new Relationship({formula: "5 * in + 0.5 * out"});
      });

      return it("should return the correct selectors", function() {
        const selections = RelationFactory.selectionsFromRelation(this.relation);
        should.not.exist(selections.vector);
        return should.not.exist(selections.scalar);
      });
    });
  });
});
