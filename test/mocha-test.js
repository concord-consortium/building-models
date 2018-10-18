# This file is just to prove that mocha
# and chai are working with requirejs
# and that we can make expectations correctly.

describe 'Testing',  ->
  describe 'With mocha and Chai', ->
    describe "should", ->
      should = require('chai').should()
      it 'should knows about equal', ->
        5.should.equal(5)
    describe "expect", ->
      expect = require('chai').expect
      it "knows about to.equal too", ->
        expect(1).to.equal(1)
