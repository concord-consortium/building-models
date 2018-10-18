/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// This file is just to prove that mocha
// and chai are working with requirejs
// and that we can make expectations correctly.

describe('Testing',  () =>
  describe('With mocha and Chai', function() {
    describe("should", function() {
      const should = require('chai').should();
      return it('should knows about equal', () => (5).should.equal(5));
    });
    return describe("expect", function() {
      const { expect } = require('chai');
      return it("knows about to.equal too", () => expect(1).to.equal(1));
    });
  })
);
