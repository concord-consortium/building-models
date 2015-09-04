global.window = { location: '' }

chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"

Node           = requireModel 'node'
GraphStore    = require "#{__dirname}/../src/code/stores/graph-store"
CodapConnect   = requireModel 'codap-connect'

describe "A Node", ->
  beforeEach ->
    sandbox = Sinon.sandbox.create()
    sandbox.stub(CodapConnect, "instance", ->
      return {
        sendUndoableActionPerformed: -> return ''
      }
    )
    @graphStore = GraphStore.store
    @graphStore.init()

  afterEach ->
    CodapConnect.instance.restore()


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
    newNode = new Node({title: "a", initialValue: 50}, 'a')
    @graphStore.addNode newNode
    node = @graphStore.getNodes()[0]
    node.initialValue.should.equal 50
    @graphStore.changeNode({initialValue: 20}, node)
    node.initialValue.should.equal 20


  it "can ensure that min, max and initialValue remain sane", ->
    newNode = new Node({title: "a", min: 0, max: 100, initialValue: 50}, 'a')
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


