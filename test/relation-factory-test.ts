import * as chai from "chai";
chai.config.includeStack = true;

const should = chai.should();
const { expect } = chai;

import { RelationFactory } from "../src/code/models/relation-factory";
import { Relationship } from "../src/code/models/relationship";

describe("RelationFactory", () => {
  let underTest: Relationship;
  let relation: Relationship;
  let vector;
  let scalar;

  beforeEach(() => {
    vector = RelationFactory.increase;
    scalar = RelationFactory.aboutTheSame;
  });

  it("should exists", () => RelationFactory.should.exist);


  describe("fromSelections", () =>
    describe("increase aboutTheSame", () => {
      beforeEach(() => {
        underTest = RelationFactory.fromSelections(vector, scalar);
      });

      it("should make a working relationship", () => {
        expect(underTest.hasError).to.equal(false);
      });

      describe("the function", () =>
        it("should be `out + in`", () => {
          underTest.formula.should.equal("1 * in");
        })
      );

      describe("evaluating the function for out=1 and in=6", () =>
        it("should evaluate to 7", () => {
          underTest.evaluate(6, 1).should.equal(6);
        })
      );
    })
  );

  describe("selectionsFromRelation", () => {
    describe("with an instanace of increase aboutTheSame", () => {
      beforeEach(() => {
        relation = RelationFactory.fromSelections(vector, scalar);
      });

      it("should return the correct selectors", () => {
        const selections = RelationFactory.selectionsFromRelation(relation);
        selections.vector.should.equal(RelationFactory.increase);
        selections.scalar.should.equal(RelationFactory.aboutTheSame);
      });
    });

    describe("with a randomish formula", () => {
      beforeEach(() => {
        relation = new Relationship({formula: "5 * in + 0.5 * out"});
      });

      it("should return the correct selectors", () => {
        const selections = RelationFactory.selectionsFromRelation(relation);
        should.not.exist(selections.vector);
        should.not.exist(selections.scalar);
      });
    });
  });
});
