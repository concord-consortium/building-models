/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
global._   = require('lodash');
global.log = require('loglevel');
const chai       = require('chai');
const HashParams = require('../src/code/utils/hash-parameters');

chai.config.includeStack = true;

const { expect }         = chai;
const should         = chai.should();
const Sinon          = require('sinon');

describe("HashParameters", function() {

  beforeEach(function() {
    this.locationHash     = "";
    const writeLocationHash = v => { return this.locationHash = v; };
    const readLocationHash  = () => this.locationHash;

    // Stub the internal methods which read / write window.location.hash
    Sinon.stub(HashParams, 'writeHash', writeLocationHash);
    Sinon.stub(HashParams,  'readHash',  readLocationHash);

    // store a few encoded values
    this.encodedURL = "https%3A%2F%2Fwww.pivotaltracker.com%2Fn%2Fprojects%2F1263626";
    return this.decodedURL = "https://www.pivotaltracker.com/n/projects/1263626";
  });

  afterEach(function() {
    HashParams.writeHash.restore();
    return HashParams.readHash.restore();
  });

  return describe("reading writing parameters", function() {
    beforeEach(function() {
      HashParams.setParam('url', this.decodedURL);
      return HashParams.setParam('foo', 'bar');
    });

    it("The pameter should be set", function() {
      HashParams.getParam('url').should.equal(this.decodedURL);
      return HashParams.getParam('foo').should.equal('bar');
    });

    it("should have encoded the URL in the locationHash", function() {
      return this.locationHash.should.have.string(`url=${this.encodedURL}`);
    });

    it("should have the stored string 'bar' in the location hash", function() {
      return this.locationHash.should.have.string("foo=bar");
    });

    return describe("removing parameters", function() {
      beforeEach(() => HashParams.clearParam('url'));

      it("should return null when trying to fetch the value from the param list", () => expect(HashParams.getParam('url')).to.not.exist);

      it("should keep other items in the params list", () => HashParams.getParam('foo').should.equal('bar'));

      it("should remove the parameter from the locationHash", function() {
        return this.locationHash.should.not.have.string("url");
      });

      return it("should keep other parameters in the locationHash", function() {
        return this.locationHash.should.have.string("foo=bar");
      });
    });
  });
});
