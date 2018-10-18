global.window = { location: '' }

chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"
Node           = requireModel 'node'

describe "Serialization", ->
  describe "for a single default Node", ->
    beforeEach ->
      @node = new Node({title: "a", x:10, y:15}, 'a')
      @serializedForm = @node.toExport()

    describe "its serialized form", ->
      it "should always include `combineMethod`", ->
        expect(@serializedForm.data.combineMethod).to.equal('average')
