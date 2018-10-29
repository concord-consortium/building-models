/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// This file is just to prove that mocha
// and chai are working with requirejs
// and that we can make expectations correctly.

import * as chai from "chai";

describe("Testing",  () =>
  describe("With mocha and Chai", () => {
    describe("should", () => {
      const should = chai.should();
      it("should knows about equal", () => (5).should.equal(5));
    });
    describe("expect", () => {
      const { expect } = chai;
      it("knows about to.equal too", () => expect(1).to.equal(1));
    });
  })
);
