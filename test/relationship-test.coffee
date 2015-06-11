global._   = require 'lodash'
global.log = require 'loglevel'

chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"

Relationship = requireModel("relationship")

describe "relationship", ->
  it "should exists", ->
    Relationship.should.exist

  describe "the constructor", ->
    beforeEach ->
      @arguments = {}
    describe "using the defaults", ->
      it "should make a working relationship", ->
        undertest = new Relationship(@arguments)
        undertest.text.should.equal "No relation defined"
        undertest.formula.should.equal "out + 0 * in"

  describe "evaluate", ->
    describe "a simple formula", ->
      beforeEach ->
        @inFormula = "2 * in ^ 2 + out"
        @arguments = {formula: @inFormula}
        @undertest = new Relationship(@arguments)

      it "should do the math correctly", ->
        @undertest.evaluate(2,2).should.equal 10
        @undertest.evaluate(2,1).should.equal 9
        @undertest.evaluate(1,1).should.equal 3

      it "should not have errors", ->
        @undertest.hasError.should.be.false

    describe "a formula with an error", ->
      beforeEach ->
        @inFormula = "x +-+- 2 * in ^ 2"
        @arguments = {formula: @inFormula}
        @undertest = new Relationship(@arguments)

      it "should return a magic error number", ->
        @undertest.evaluate(2,2).should.equal Relationship.errValue

      it "should indivcate an error", ->
        @undertest.hasError.should.be.true
