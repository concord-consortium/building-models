global._   = require 'lodash'
global.log = require 'loglevel'

chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"

RelationFactory = requireModel("relation-factory")
Relationship    = requireModel("relationship")

describe "RelationFactory", ->
  beforeEach ->
    @vector = RelationFactory.increase
    @scalar = RelationFactory.aboutTheSame

  it "should exists", ->
    RelationFactory.should.exist


  describe "fromSelections", ->
    describe "increase aboutTheSame", ->
      beforeEach ->
        @underTest = RelationFactory.fromSelections(@vector,@scalar)

      it "should make a working relationship", ->
        @underTest.hasError.should.be.false

      describe "the function", ->
        it "should be `out + in`", ->
          @underTest.formula.should.equal 'out + in'

      describe "evaluating the function for out=1 and in=6", ->
        it "should evaluate to 7", ->
          @underTest.evaluate(6,1).should.equal 7

  describe "selectionsFromRelation", ->
    describe "with an instanace of increase aboutTheSame", ->
      beforeEach ->
        @relation = RelationFactory.fromSelections(@vector, @scalar)

      it "should return the correct selectors", ->
        selections = RelationFactory.selectionsFromRelation(@relation)
        selections.vector.should.equal RelationFactory.increase
        selections.scalar.should.equal RelationFactory.aboutTheSame

    describe "with a randomish formula", ->
      beforeEach ->
        @relation = new Relationship({formula: "5 * in + 0.5 * out"})

      it "should return the correct selectors", ->
        selections = RelationFactory.selectionsFromRelation(@relation)
        should.not.exist(selections.vector)
        should.not.exist(selections.scalar)
