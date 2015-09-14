global._   = require 'lodash'
global.log = require 'loglevel'
chai       = require('chai')
HashParams = require '../src/code/utils/hash-parameters'

chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

describe "HashParameters", ->

  beforeEach ->
    @locationHash     = ""
    writeLocationHash = (v) => @locationHash = v
    readLocationHash  = => @locationHash

    # Stub the internal methods which read / write window.location.hash
    Sinon.stub(HashParams, 'writeHash', writeLocationHash)
    Sinon.stub(HashParams,  'readHash',  readLocationHash)

    # store a few encoded values
    @encodedURL = "https%3A%2F%2Fwww.pivotaltracker.com%2Fn%2Fprojects%2F1263626"
    @decodedURL = "https://www.pivotaltracker.com/n/projects/1263626"

  afterEach ->
    HashParams.writeHash.restore()
    HashParams.readHash.restore()

  describe "reading writing parameters", ->
    beforeEach ->
      HashParams.setParam('url', @decodedURL)
      HashParams.setParam('foo', 'bar')

    it "The pameter should be set", ->
      HashParams.getParam('url').should.equal @decodedURL
      HashParams.getParam('foo').should.equal 'bar'

    it "should have encoded the URL in the locationHash", ->
      @locationHash.should.have.string "url=#{@encodedURL}"

    it "should have the stored string 'bar' in the location hash", ->
      @locationHash.should.have.string "foo=bar"

    describe "removing parameters", ->
      beforeEach ->
        HashParams.clearParam('url')

      it "should return null when trying to fetch the value from the param list", ->
        expect(HashParams.getParam('url')).to.not.exist

      it "should keep other items in the params list", ->
        HashParams.getParam('foo').should.equal 'bar'

      it "should remove the parameter from the locationHash", ->
        @locationHash.should.not.have.string "url"

      it "should keep other parameters in the locationHash", ->
        @locationHash.should.have.string "foo=bar"
