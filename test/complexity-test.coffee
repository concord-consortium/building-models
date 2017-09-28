global._      = require 'lodash'
global.log    = require 'loglevel'
global.Reflux = require 'reflux'
global.window = { location: '' }
global.window.performance = {
  now: ->
    Date.now()
}
global.requestAnimationFrame = (callback) ->
  setTimeout callback, 1

chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"

Link            = requireModel 'link'
Node            = requireModel 'node'
RelationFactory = requireModel 'relation-factory'
CodapConnect    = requireModel 'codap-connect'

requireStore = (name) -> require "#{__dirname}/../src/code/stores/#{name}"

GraphStore       = requireStore('graph-store').store
AppSettingsStore = requireStore('app-settings-store').store


LinkNodes = (sourceNode, targetNode, relation) ->
  link = new Link
    title: "function"
    sourceNode: sourceNode
    targetNode: targetNode
    relation: relation
  link

describe "The minimum complexity", ->
  beforeEach ->
    @sandbox = Sinon.sandbox.create()
    @sandbox.stub CodapConnect, "instance", ->
      sendUndoableActionPerformed: -> return ''

    @graphStore = GraphStore
    @graphStore.init()

  afterEach ->
    CodapConnect.instance.restore()

  describe "for a graph without relations", ->
    beforeEach ->
      nodeA    = new Node()
      nodeB    = new Node()
      link     = LinkNodes(nodeA, nodeB)

      @graphStore.addNode nodeA
      @graphStore.addNode nodeB
      @graphStore.addLink link

    it "should be diagram-only", ->
      @graphStore.getMinimumComplexity().should.equal AppSettingsStore.Complexity.diagramOnly

  describe "for a graph with only an `about the same` relation", ->
    beforeEach ->
      nodeA    = new Node()
      nodeB    = new Node()
      vector   = RelationFactory.decrease
      scalar   = RelationFactory.aboutTheSame
      relation = RelationFactory.fromSelections vector, scalar
      link     = LinkNodes(nodeA, nodeB, relation)

      @graphStore.addNode nodeA
      @graphStore.addNode nodeB
      @graphStore.addLink link

    it "should be basic", ->
      @graphStore.getMinimumComplexity().should.equal AppSettingsStore.Complexity.basic

  describe "for a graph with an `a lot` relation", ->
    beforeEach ->
      nodeA    = new Node()
      nodeB    = new Node()
      vector   = RelationFactory.increase
      scalar   = RelationFactory.aLot
      relation = RelationFactory.fromSelections vector, scalar
      link     = LinkNodes(nodeA, nodeB, relation)

      @graphStore.addNode nodeA
      @graphStore.addNode nodeB
      @graphStore.addLink link

    it "should be expanded", ->
      @graphStore.getMinimumComplexity().should.equal AppSettingsStore.Complexity.expanded

  describe "for a graph with a collector", ->
    beforeEach ->
      nodeA    = new Node()
      nodeB    = new Node({isAccumulator: true})
      link     = LinkNodes(nodeA, nodeB)

      @graphStore.addNode nodeA
      @graphStore.addNode nodeB
      @graphStore.addLink link

    it "should be collectors", ->
      @graphStore.getMinimumComplexity().should.equal AppSettingsStore.Complexity.collectors
