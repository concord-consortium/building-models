global._ = require 'lodash'
global.log = require 'loglevel'
global.Reflux = require 'reflux'

global.window = { location: '' }


chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"

GraphPrimitive = requireModel 'graph-primitive'
Link           = requireModel 'link'
Node           = requireModel 'node'
GraphStore    = require "#{__dirname}/../src/code/stores/graph-store"
CodapConnect   = requireModel 'codap-connect'
Relationship   = requireModel 'relationship'

LinkNodes = (sourceNode, targetNode, formula) ->
  link = new Link
    title: "function"
    sourceNode: sourceNode
    targetNode: targetNode
    relation: new Relationship
      formula: formula
  sourceNode.addLink(link)
  targetNode.addLink(link)

describe 'GraphPrimitive', ->
  it 'GraphPrimitive should exists', ->
    GraphPrimitive.should.exist

  describe 'the type', ->
    undertest = new GraphPrimitive()
    undertest.type.should.equal('GraphPrimitive')

  describe 'the id', ->
    beforeEach ->
      GraphPrimitive.reset_counters()

    describe 'of a GraphPrimitive', ->
      it 'should increment the counter, and use the type name (GraphPrimitive)', ->
        undertest = new GraphPrimitive()
        undertest.id.should.equal('GraphPrimitive-1')

    describe 'of a Link', ->
      it 'should increment the counter, and use the type name (Link)', ->
        undertest = new Link()
        undertest.id.should.equal('Link-1')
        secondLink = new Link()
        secondLink.id.should.equal('Link-2')

    describe 'of a Node', ->
      it 'should increment the counter, and use the type name (Node)', ->
        undertest = new Node()
        undertest.id.should.equal('Node-1')
        secondNode = new Node()
        secondNode.id.should.equal('Node-2')

describe 'Link', ->
  describe 'terminalKey', ->
    beforeEach ->
      @link = new Link(
        sourceNode: {key: 'source'},
        sourceTerminal: 'a',
        targetNode: {key: 'target'},
        targetTerminal: 'b',
        title: 'unkown link'
      )
    it "should have a reasonable text based terminalKey", ->
      @link.terminalKey().should.equal("source ------> target")

describe 'Node', ->
  beforeEach ->
    @node_a = new Node({title: "Node a"},'a')
    @node_b = new Node({title: "Node b"},'b')
    @node_c = new Node({title: "Node c"},'c')

  ###
    Note cyclic graph in A <-> B
                   +---+
          +-------->   |
          |        | B |
        +-+-+      |   |
        |   <----------+
        | A |      +---+
        |   +------>   |
        +---+      | C |
                   |   |
                   +---+
  ###
  describe 'its links', ->
    beforeEach ->
      @link_a = new Link
        title: "link a"
        sourceNode: @node_a
        targetNode: @node_b

      @link_b = new Link
        title: "link b"
        sourceNode: @node_a
        targetNode: @node_c

      @link_c = new Link
        title: "link c"
        sourceNode: @node_b
        targetNode: @node_a

      @link_without_a = new Link
        title: "link without a"
        sourceNode: @node_b
        targetNode: @node_c


    describe 'rejecting bad links', ->
      describe 'links that dont include itself', ->
        it "it shouldn't add a link it doesn't belong to",  ->
          fn =  =>
            @node_a.addLink(@link_without_a)
          fn.should.throw("Bad link")

      describe 'links that it already has', ->
        beforeEach ->
          @node_a.addLink(@link_a)
        it 'should throw an error when re-linking',  ->
          fn =  =>
            @node_a.addLink(@link_a)
          fn.should.throw("Duplicate link")

    describe 'sorting links', ->
      describe "a node with two out links, and one in link", ->
        beforeEach ->
          @node_a.addLink(@link_a)
          @node_a.addLink(@link_b)
          @node_a.addLink(@link_c)

        describe 'In Links', ->
          it "should have 1 in link", ->
            @node_a.inLinks().should.have.length(1)

        describe 'outLinks', ->
          it "should have 2 outlinks", ->
            @node_a.outLinks().should.have.length(2)

        describe 'inNodes', ->
          it "should have 1 inNode", ->
            @node_a.inNodes().should.have.length(1)
          it "should include node_c", ->
            @node_a.inNodes().should.include(@node_b)

        describe 'downstreamNodes', ->
          it "should have some nodes", ->
            @node_a.downstreamNodes().should.have.length(2)

        describe '#infoString', ->
          it "should print a list of nodes its connected to", ->
            expected = "Node a  --link a-->[Node b], --link b-->[Node c]"
            @node_a.infoString().should.equal(expected)

  describe "GraphStore", ->
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

    afterEach ->
      CodapConnect.instance.restore()

    describe "addLink", ->
      describe "When the link doesn't already exist", ->
        it "should add a new link", ->
          should.not.exist @graphStore.linkKeys['newLink']
          @graphStore.addLink(@newLink)
          @graphStore.linkKeys['newLink'].should.equal(@newLink)
          should.not.exist @graphStore.linkKeys['otherNewLink']
          @graphStore.addLink(@otherNewLink)
          @graphStore.linkKeys['otherNewLink'].should.equal(@otherNewLink)

      describe "When the link does already exist", ->
        beforeEach ->
          @graphStore.linkKeys['newLink'] = 'oldValue'
        it "should not add the new link", ->
          @graphStore.addLink(@newLink)
          @graphStore.linkKeys['newLink'].should.equal('oldValue')

describe "Graph Topology", ->

  beforeEach ->
    sandbox = Sinon.sandbox.create()
    sandbox.stub(CodapConnect, "instance", ->
      return {
        sendUndoableActionPerformed: -> return ''
      }
    )

  afterEach ->
    CodapConnect.instance.restore()

  # A ->  B  -> D
  # └< C <┘
  describe "a graph with a totally independent cycle", ->
    beforeEach ->
      @nodeA    = new Node()
      @nodeB    = new Node()
      @nodeC    = new Node()
      @nodeD    = new Node()
      @formula  = "1 * in"

      LinkNodes(@nodeA, @nodeB, @formula)
      LinkNodes(@nodeB, @nodeC, @formula)
      LinkNodes(@nodeC, @nodeA, @formula)
      LinkNodes(@nodeB, @nodeD, @formula)

      graphStore = GraphStore.store
      graphStore.init()
      graphStore.addNode @nodeA
      graphStore.addNode @nodeB
      graphStore.addNode @nodeC
      graphStore.addNode @nodeD

    it "should mark the nodes that can have initial values edited", ->
      @nodeA.canEditInitialValue().should.equal true
      @nodeB.canEditInitialValue().should.equal true
      @nodeC.canEditInitialValue().should.equal true
      @nodeD.canEditInitialValue().should.equal false

    it "should mark the nodes that can have values edited while running", ->
      @nodeA.canEditValueWhileRunning().should.equal false
      @nodeB.canEditValueWhileRunning().should.equal false
      @nodeC.canEditValueWhileRunning().should.equal false
      @nodeD.canEditValueWhileRunning().should.equal false


  # A -> B  -> C -> E
  #      └< D <┘
  describe "a graph with cycles with independent inputs", ->
    beforeEach ->
      @nodeA    = new Node()
      @nodeB    = new Node()
      @nodeC    = new Node()
      @nodeD    = new Node()
      @nodeE    = new Node()
      @formula  = "1 * in"

      LinkNodes(@nodeA, @nodeB, @formula)
      LinkNodes(@nodeB, @nodeC, @formula)
      LinkNodes(@nodeC, @nodeD, @formula)
      LinkNodes(@nodeD, @nodeB, @formula)
      LinkNodes(@nodeC, @nodeE, @formula)

      graphStore = GraphStore.store
      graphStore.init()
      graphStore.addNode @nodeA
      graphStore.addNode @nodeB
      graphStore.addNode @nodeC
      graphStore.addNode @nodeD
      graphStore.addNode @nodeE

    it "should mark the nodes that can have initial values edited", ->
      @nodeA.canEditInitialValue().should.equal true
      @nodeB.canEditInitialValue().should.equal false
      @nodeC.canEditInitialValue().should.equal false
      @nodeD.canEditInitialValue().should.equal false
      @nodeE.canEditInitialValue().should.equal false

    it "should mark the nodes that can have values edited while running", ->
      @nodeA.canEditValueWhileRunning().should.equal true
      @nodeB.canEditValueWhileRunning().should.equal false
      @nodeC.canEditValueWhileRunning().should.equal false
      @nodeD.canEditValueWhileRunning().should.equal false
      @nodeE.canEditValueWhileRunning().should.equal false


  # A -> B+ -> C
  describe "a graph with collectors", ->
    beforeEach ->
      @nodeA    = new Node()
      @nodeB    = new Node({isAccumulator: true})
      @nodeC    = new Node()
      @formula  = "1 * in"

      LinkNodes(@nodeA, @nodeB, @formula)
      LinkNodes(@nodeB, @nodeC, @formula)

      graphStore = GraphStore.store
      graphStore.init()
      graphStore.addNode @nodeA
      graphStore.addNode @nodeB
      graphStore.addNode @nodeC

    it "should mark the nodes that can have initial values edited", ->
      @nodeA.canEditInitialValue().should.equal true
      @nodeB.canEditInitialValue().should.equal true
      @nodeC.canEditInitialValue().should.equal false

    it "should mark the nodes that can have values edited while running", ->
      @nodeA.canEditValueWhileRunning().should.equal true
      @nodeB.canEditValueWhileRunning().should.equal false
      @nodeC.canEditValueWhileRunning().should.equal false

  # A -x-> B -> C
  describe "a graph with undefined relations", ->
    beforeEach ->
      @nodeA    = new Node()
      @nodeB    = new Node({isAccumulator: true})
      @nodeC    = new Node()
      @formula  = "1 * in"

      LinkNodes(@nodeA, @nodeB)
      LinkNodes(@nodeB, @nodeC, @formula)

      graphStore = GraphStore.store
      graphStore.init()
      graphStore.addNode @nodeA
      graphStore.addNode @nodeB
      graphStore.addNode @nodeC

    it "should mark the nodes that can have initial values edited", ->
      @nodeA.canEditInitialValue().should.equal true
      @nodeB.canEditInitialValue().should.equal true
      @nodeC.canEditInitialValue().should.equal false

    it "should mark the nodes that can have values edited while running", ->
      @nodeA.canEditValueWhileRunning().should.equal true
      @nodeB.canEditValueWhileRunning().should.equal true
      @nodeC.canEditValueWhileRunning().should.equal false
