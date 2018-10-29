chai.config.includeStack = true;

const should = chai.should();

import { RelationFactory } from "../src/code/models/relation-factory";
import { Relationship } from "../src/code/models/relationship";

describe("RelationFactory", () => {
  beforeEach(() => {
    this.vector = RelationFactory.increase;
    this.scalar = RelationFactory.aboutTheSame;
  });

  it("should exists", () => RelationFactory.should.exist);


  describe("fromSelections", () =>
    describe("increase aboutTheSame", () => {
      beforeEach(() => {
        this.underTest = RelationFactory.fromSelections(this.vector, this.scalar);
      });

      it("should make a working relationship", () => {
        this.underTest.hasError.should.be.false();
      });

      describe("the function", () =>
        it("should be `out + in`", () => {
          this.underTest.formula.should.equal("1 * in");
        })
      );

      describe("evaluating the function for out=1 and in=6", () =>
        it("should evaluate to 7", () => {
          this.underTest.evaluate(6, 1).should.equal(6);
        })
      );
    })
  );

  describe("selectionsFromRelation", () => {
    describe("with an instanace of increase aboutTheSame", () => {
      beforeEach(() => {
        this.relation = RelationFactory.fromSelections(this.vector, this.scalar);
      });

      it("should return the correct selectors", () => {
        const selections = RelationFactory.selectionsFromRelation(this.relation);
        selections.vector.should.equal(RelationFactory.increase);
        selections.scalar.should.equal(RelationFactory.aboutTheSame);
      });
    });

    describe("with a randomish formula", () => {
      beforeEach(() => {
        this.relation = new Relationship({formula: "5 * in + 0.5 * out"});
      });

      it("should return the correct selectors", () => {
        const selections = RelationFactory.selectionsFromRelation(this.relation);
        should.not.exist(selections.vector);
        should.not.exist(selections.scalar);
      });
    });
  });
});
