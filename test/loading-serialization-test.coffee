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

describe "Serialization and Loading", ->
  beforeEach ->
    sandbox = Sinon.sandbox.create()
    sandbox.stub(CodapConnect, "instance", ->
      return {
        sendUndoableActionPerformed: -> return ''
      }
    )

    @serializedForm = JSON.stringify SerializedTestData
    @fakePalette = {a: 1, b:2}

  afterEach ->
    CodapConnect.instance.restore()


  describe "For a model created by a user", ->

    beforeEach ->
      @graphStore = GraphStore.store
      @graphStore.init()

      @nodeA = new Node({title: "a", x:10, y:15}, 'a')
      @nodeB = new Node({title: "b", x:20, y:25}, 'b')
      @link = new Link({
        sourceNode: @nodeA
        targetNode: @nodeB
        targetTerminal: "a"
        sourceTerminal: "b"
      })

      @graphStore.addNode @nodeA
      @graphStore.addNode @nodeB
      @graphStore.addLink @link

    describe "The serialize function", ->
      it "should serialize all the properties of the model", ->
        model = @graphStore.serialize()

        model.version.should.exist
        model.nodes.should.exist
        model.links.should.exist

        model.version.should.equal 1.2
        model.nodes.length.should.equal 2
        model.links.length.should.equal 1

      it "should correctly serialize a node", ->
        node = @graphStore.serialize().nodes[0]
        node.key.should.equal "a"
        node.data.title.should.equal "a"
        node.data.x.should.equal 10
        node.data.y.should.equal 15
        node.data.initialValue.should.equal 50
        node.data.isAccumulator.should.equal false
        node.data.valueDefinedSemiQuantitatively.should.equal false

      it "should correctly serialize a link", ->
        link = @graphStore.serialize().links[0]
        link.title.should.equal ""
        link.color.should.equal "#777"
        link.sourceNode.should.equal "a"
        link.sourceTerminal.should.equal "b"
        link.targetNode.should.equal "b"
        link.targetTerminal.should.equal "a"
        link.relation.text.should.equal "increases"
        link.relation.formula.should.equal "1 * in"

    describe "the toJsonString function", ->
      it "should create a string nodes and links", ->
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
