const g = global as any;

import { HashParams } from "../src/code/utils/hash-parameters";

import * as chai from "chai";
chai.config.includeStack = true;

const { expect } = chai;
const Sinon      = require("sinon");

describe("HashParameters", () => {

  beforeEach(() => {
    this.locationHash     = "";
    const writeLocationHash = v => this.locationHash = v;
    const readLocationHash  = () => this.locationHash;

    // Stub the internal methods which read / write window.location.hash
    Sinon.stub(HashParams, "writeHash", writeLocationHash);
    Sinon.stub(HashParams,  "readHash",  readLocationHash);

    // store a few encoded values
    this.encodedURL = "https%3A%2F%2Fwww.pivotaltracker.com%2Fn%2Fprojects%2F1263626";
    this.decodedURL = "https://www.pivotaltracker.com/n/projects/1263626";
  });

  afterEach(() => {
    (HashParams.writeHash as any).restore();
    (HashParams.readHash as any).restore();
  });

  return describe("reading writing parameters", () => {
    beforeEach(() => {
      HashParams.setParam("url", this.decodedURL);
      HashParams.setParam("foo", "bar");
    });

    it("The pameter should be set", () => {
      HashParams.getParam("url").should.equal(this.decodedURL);
      HashParams.getParam("foo").should.equal("bar");
    });

    it("should have encoded the URL in the locationHash", () => {
      this.locationHash.should.have.string(`url=${this.encodedURL}`);
    });

    it("should have the stored string 'bar' in the location hash", () => {
      this.locationHash.should.have.string("foo=bar");
    });

    describe("removing parameters", () => {
      beforeEach(() => HashParams.clearParam("url"));

      it("should return null when trying to fetch the value from the param list", () => expect(HashParams.getParam("url")).to.not.exist);

      it("should keep other items in the params list", () => HashParams.getParam("foo").should.equal("bar"));

      it("should remove the parameter from the locationHash", () => {
        this.locationHash.should.not.have.string("url");
      });

      it("should keep other parameters in the locationHash", () => {
        this.locationHash.should.have.string("foo=bar");
      });
    });
  });
});
