global.window = { location: '' }

chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"

Link           = requireModel 'link'
Node           = requireModel 'node'
GraphStore    = require "#{__dirname}/../src/code/stores/graph-store"
CodapConnect   = requireModel 'codap-connect'

SerializedTestData = require "./serialized-test-data/v-0.1"

describe "Serialization", ->
  beforeEach ->
    sandbox = Sinon.sandbox.create()
    sandbox.stub(CodapConnect, "instance", ->
      return {
        sendUndoableActionPerformed: -> return ''
      }
    )

    @nodeA = new Node({title: "a", x:10, y:10}, 'a')
    @nodeB = new Node({title: "b", x:20, y:20}, 'b')
    @graphStore = GraphStore.store
    @graphStore.init()
    @graphStore.addNode @nodeA
    @graphStore.addNode @nodeB

    @newLink = new Link({
      sourceNode: @nodeA
      targetNode: @nodeB
      targetTerminal: "a"
      sourceTerminal: "b"
    })
    @newLink.terminalKey = ->
      "newLink"

    @otherNewLink = new Link({
      sourceNode: @nodeB
      targetNode: @nodeA
    })
    @otherNewLink.terminalKey = ->
      "otherNewLink"
    @serializedForm = JSON.stringify SerializedTestData
    @fakePalette = {a: 1, b:2}

  afterEach ->
    CodapConnect.instance.restore()


  describe "toJsonString", ->
    it "should include nodes and links", ->
      @nodeA.key.should.equal("a")
      @graphStore.addLink(@newLink)
      @graphStore.nodeKeys["a"].should.equal(@nodeA)
      jsonString = @graphStore.toJsonString()
      jsonString.should.match(/"nodes":/)
      jsonString.should.match(/"links":/)
      jsonString.should.not.match(/"description":/)
      jsonString.should.not.match(/"metadata":/)
      @graphStore.toJsonString(@fakePalette).should.match(/"palette":/)

  describe "loadData", ->
    beforeEach ->
      @graphStore = GraphStore.store
      @graphStore.init()
    it "should read the serialized data without error", ->
      data = JSON.parse(@serializedForm)
      @graphStore.loadData(data)
      @graphStore.nodeKeys.should.have.any.keys("a")
      @graphStore.nodeKeys.should.have.any.keys("b")
