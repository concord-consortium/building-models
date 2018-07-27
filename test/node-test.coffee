global.window = { location: '' }

chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"

Node           = requireModel 'node'
GraphStore     = require "#{__dirname}/../src/code/stores/graph-store"
CodapHelper    = require './codap-helper'

describe "A Node", ->
  beforeEach ->
    CodapHelper.Stub()
    @graphStore = GraphStore.store
    @graphStore.init()

  afterEach ->
    CodapHelper.UnStub()

  it "can be added with properties", ->
    newNode = new Node({title: "a", x:10, y:15}, 'a')
    @graphStore.addNode newNode
    nodes = @graphStore.getNodes()
    nodes.length.should.equal 1
    node = nodes[0]
    node.key.should.equal 'a'
    node.x.should.equal 10
    node.y.should.equal 15

  it "can have its properties changed", ->
    newNode = new Node({title: "a", initialValue: 50, valueDefinedSemiQuantitatively: false}, 'a')
    @graphStore.addNode newNode
    node = @graphStore.getNodes()[0]
    node.initialValue.should.equal 50
    @graphStore.changeNode({initialValue: 20}, node)
    node.initialValue.should.equal 20
    @graphStore.changeNode({max: 200}, node)
    node.max.should.equal 200


  it "can ensure that min, max and initialValue remain sane", ->
    newNode = new Node({title: "a", min: 0, max: 100, initialValue: 50, valueDefinedSemiQuantitatively: false}, 'a')
    @graphStore.addNode newNode
    node = @graphStore.getNodes()[0]

    @graphStore.changeNode({min: 80}, node)
    node.min.should.equal 80
    node.max.should.equal 100
    node.initialValue.should.equal 80

    @graphStore.changeNode({min: 120}, node)
    node.min.should.equal 120
    node.max.should.equal 120
    node.initialValue.should.equal 120

  describe "In semi-quantitative mode", ->

    it "will always report min and max as 0 and 100...", ->
        newNode = new Node({title: "a", min: 50, max: 200, valueDefinedSemiQuantitatively: true}, 'a')
        @graphStore.addNode newNode
        node = @graphStore.getNodes()[0]
        node.min.should.equal 0
        node.max.should.equal 100
        @graphStore.changeNode({min: 100, max: 250}, node)
        node.min.should.equal 0
        node.max.should.equal 100

    it "...but it will remember the set values when it becomes quantitative", ->
        newNode = new Node({title: "a", min: 50, max: 200, valueDefinedSemiQuantitatively: true}, 'a')
        @graphStore.addNode newNode
        node = @graphStore.getNodes()[0]
        node.min.should.equal 0
        node.max.should.equal 100
        @graphStore.changeNode({valueDefinedSemiQuantitatively: false}, node)
        node.min.should.equal 50
        node.max.should.equal 200

    it "will switch initialValue correctly when changing modes back and forth", ->
        newNode = new Node({title: "a", min: 0, max: 100, initialValue: 50, valueDefinedSemiQuantitatively: true}, 'a')
        @graphStore.addNode newNode
        node = @graphStore.getNodes()[0]
        node.initialValue.should.equal 50

        # switch to quant mode. Initially, no change
        @graphStore.changeNode({valueDefinedSemiQuantitatively: false}, node)
        node.initialValue.should.equal 50

        # change inital value, min and max
        @graphStore.changeNode({min: 100, max: 150, initialValue: 140}, node)
        node.initialValue.should.equal 140

        # switch back to semi-quant mode. InitialValue should be at 80%
        @graphStore.changeNode({valueDefinedSemiQuantitatively: true}, node)
        node.initialValue.should.equal 80

        # change inital value to 10% and then switch back to quant mode.
        # InitialValue should now be 10% of the way between 100 and 150
        @graphStore.changeNode({initialValue: 10}, node)
        node.initialValue.should.equal 10
        @graphStore.changeNode({valueDefinedSemiQuantitatively: false}, node)
        node.initialValue.should.equal 105


