global.window = { location: '' }
global._      = require 'lodash'
global.log    = require 'loglevel'
global.Reflux = require 'reflux'

chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"

Link             = requireModel 'link'
Node             = requireModel 'node'
GraphStore       = require "#{__dirname}/../src/code/stores/graph-store"
AppSettingsStore = require "#{__dirname}/../src/code/stores/app-settings-store"
SimulationStore  = require "#{__dirname}/../src/code/stores/simulation-store"
CodapConnect     = requireModel 'codap-connect'

SerializedTestData = require "./serialized-test-data/v-0.1"

describe "Serialization and Loading", ->
  beforeEach ->
    @sandbox = Sinon.sandbox.create()
    @sandbox.stub CodapConnect, "instance", ->
      sendUndoableActionPerformed: -> return ''

    @serializedForm = JSON.stringify SerializedTestData
    @fakePalette = [
      "title": "Dingo"
      "image": "data:image/dingo"
      "metadata":
        "source": "external"
        "title": "Dingo"
        "link": ""
        "license": "public domain"
      "key": "data:image/dingo"
      "uuid": "uuid-dingo"
    ,
      "title": "Bee"
      "image": "data:image/bee"
      "metadata": {
        "source": "search",
        "title": "Honey bee",
        "description": "A honey bee. Uma abelha.",
        "link": "https://openclipart.org/detail/62203/Honey%20bee"
      },
      "key": "data:image/bee"
      "uuid": "uuid-bee"
    ]

  afterEach ->
    CodapConnect.instance.restore()


  describe "For a model created by a user", ->

    beforeEach ->
      @graphStore = GraphStore.store
      @graphStore.init()

      @nodeA = new Node({title: "a", x:10, y:15, paletteItem:"uuid-dingo"}, 'a')
      @nodeB = new Node({title: "b", x:20, y:25, paletteItem:"uuid-bee"}, 'b')
      @link = new Link({
        sourceNode: @nodeA
        targetNode: @nodeB
        targetTerminal: "a"
        sourceTerminal: "b"
      })

      @graphStore.addNode @nodeA
      @graphStore.addNode @nodeB
      @graphStore.addLink @link

    describe "The toJsonString function", ->
      it "should serialize all the properties of the model", ->
        jsonString = @graphStore.toJsonString()
        model = JSON.parse jsonString

        model.version.should.exist
        model.nodes.should.exist
        model.links.should.exist

        model.version.should.equal "1.11.0"
        model.nodes.length.should.equal 2
        model.links.length.should.equal 1

      it "should correctly serialize a node", ->
        jsonString = @graphStore.toJsonString()
        nodeA = JSON.parse(jsonString).nodes[0]
        nodeB = JSON.parse(jsonString).nodes[1]
        nodeA.key.should.equal "a"
        nodeA.data.title.should.equal "a"
        nodeA.data.x.should.equal 10
        nodeA.data.y.should.equal 15
        nodeA.data.initialValue.should.equal 50
        nodeA.data.min.should.equal 0
        nodeA.data.max.should.equal 100
        nodeA.data.isAccumulator.should.equal false
        nodeA.data.valueDefinedSemiQuantitatively.should.equal true
        expect(nodeA.data.image).to.not.exist
        expect(nodeA.data.paletteItem).to.equal "uuid-dingo"
        expect(nodeB.data.paletteItem).to.equal "uuid-bee"

      it "should correctly serialize a link", ->
        jsonString = @graphStore.toJsonString()
        link = JSON.parse(jsonString).links[0]
        link.title.should.equal ""
        link.color.should.equal "#777"
        link.sourceNode.should.equal "a"
        link.sourceTerminal.should.equal "b"
        link.targetNode.should.equal "b"
        link.targetTerminal.should.equal "a"
        link.relation.text.should.equal "increase"
        link.relation.formula.should.equal "1 * in"

      it "should not serialize certain properties", ->
        jsonString = @graphStore.toJsonString()
        jsonString.should.not.match(/"description":/)
        jsonString.should.not.match(/"metadata":/)

      it "should be able to serialize the palette", ->
        jsonString = @graphStore.toJsonString(@fakePalette)
        palette = JSON.parse(jsonString).palette
        palette[0].uuid.should.equal "uuid-dingo"
        palette[1].uuid.should.equal "uuid-bee"

      it "should be able to serialize the settings", ->
        AppSettingsStore.store.settings.diagramOnly = true
        jsonString = @graphStore.toJsonString(@fakePalette)
        model = JSON.parse jsonString
        model.settings.diagramOnly.should.equal true

      it "should be able to serialize the simulation settings", ->
        SimulationStore.store.settings.duration = 15
        SimulationStore.store.settings.stepUnits = "SECOND"
        SimulationStore.store.settings.speed = 3
        SimulationStore.store.settings.capNodeValues = true
        SimulationStore.store.settings.newIntegration = true
        jsonString = @graphStore.toJsonString(@fakePalette)
        model = JSON.parse jsonString
        model.settings.simulation.duration.should.equal 15
        model.settings.simulation.stepUnits.should.equal "SECOND"
        model.settings.simulation.speed.should.equal 3
        model.settings.simulation.capNodeValues.should.equal true
        model.settings.simulation.newIntegration.should.equal true

  describe "loadData", ->
    beforeEach ->
      @graphStore = GraphStore.store
      @graphStore.init()

    it "should read the serialized data without error", ->
      data = JSON.parse(@serializedForm)
      @graphStore.loadData(data)
      @graphStore.nodeKeys.should.have.any.keys("a")
      @graphStore.nodeKeys.should.have.any.keys("b")

    it "should read the settings without error", ->
      data = JSON.parse(@serializedForm)
      data.settings = {diagramOnly: true}
      @graphStore.loadData(data)
      AppSettingsStore.store.settings.diagramOnly.should.equal true

    it "nodes should have paletteItem properties after loading", ->
      data = JSON.parse(@serializedForm)
      @graphStore.loadData(data)
      expect(@graphStore.nodeKeys['a'].paletteItem).to.have.length 36
      expect(@graphStore.nodeKeys['b'].paletteItem).to.have.length 36

    it "should give the nodes an image after loading", ->
      data = JSON.parse(@serializedForm)
      @graphStore.loadData(data)
      @graphStore.nodeKeys['a'].image.should.equal "img/nodes/chicken.png"
      @graphStore.nodeKeys['b'].image.should.equal "img/nodes/egg.png"
