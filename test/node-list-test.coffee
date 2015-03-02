chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

GraphPrimitive = require('../public/javascripts/models/graph-primitive')
Link           = require('../public/javascripts/models/link')
Node           = require('../public/javascripts/models/node')
LinkManager    = require('../public/javascripts/models/link-manager')


describe 'GraphPrimitive', () ->
  it 'GraphPrimitive should exists', () ->
    GraphPrimitive.should.exist
  
  describe 'the type', () ->
    undertest = new GraphPrimitive()
    undertest.type().should.equal('GraphPrimitive')
  
  describe 'the id', () ->
    beforeEach () ->
      GraphPrimitive.reset_counters()
    
    describe 'of a GraphPrimitive', () ->
      it 'should increment the counter, and use the type name (GraphPrimitive)', () ->
        undertest = new GraphPrimitive()
        undertest.id.should.equal('GraphPrimitive-1')
    
    describe 'of a Link', () ->
      it 'should increment the counter, and use the type name (Link)', () ->
        undertest = new Link()
        undertest.id.should.equal('Link-1')
        secondLink = new Link()
        secondLink.id.should.equal('Link-2')
    
    describe 'of a Node', () ->
      it 'should increment the counter, and use the type name (Node)', () ->
        undertest = new Node()
        undertest.id.should.equal('Node-1')
        secondNode = new Node()
        secondNode.id.should.equal('Node-2')

describe 'Link', () ->
  describe 'terminalKey', () ->
    beforeEach () ->
      @link = new Link(
        sourceNode: {key: 'source'},
        sourceTerminal: 'a',
        targetNode: {key: 'target'},
        targetTerminal: 'b',
        title: 'unkown link'
      )
    it "should have a reasonable text based terminalKey", () ->
      @link.terminalKey().should.equal("source[a] ---unkown link---> target[b]")

describe 'Node', () ->
  beforeEach () ->
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
  describe 'its links', () ->
    beforeEach () ->
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
      

    describe 'rejecting bad links', () ->
      describe 'links that dont include itself', () ->
        it "it shouldn't add a link it doesn't belong to", ()->
          fn = () =>
            @node_a.addLink(@link_without_a)
          fn.should.throw("Bad link")

      describe 'links that it already has', () ->
        beforeEach () ->
          @node_a.addLink(@link_a)
        it 'should throw an error when re-linking', ()->
          fn = () =>
            @node_a.addLink(@link_a)
          fn.should.throw("Duplicate link")

    describe 'sorting links', () ->
      describe "a node with two out links, and one in link", () ->
        beforeEach () ->
          @node_a.addLink(@link_a)
          @node_a.addLink(@link_b)
          @node_a.addLink(@link_c)

        describe 'In Links', () ->
          it "should have 1 in link", () ->
            @node_a.inLinks().should.have.length(1)
        
        describe 'outLinks', () ->
          it "should have 2 outlinks", () ->
            @node_a.outLinks().should.have.length(2)

        describe 'downstreamNodes', () ->
          it "should have some nodes", () ->
            @node_a.downstreamNodes().should.have.length(2)

        describe '#infoString', () ->
          it "should print a list of nodes its connected to", () ->
            expected = "Node a  --link a-->[Node b], --link b-->[Node c]"
            @node_a.infoString().should.equal(expected)

  describe "LinkManager", () ->
    beforeEach () ->
      @nodeA = new Node({}, 'a')
      @nodeB = new Node({}, 'b')
      @nodeList = new LinkManager()
      @nodeList.addNode(@nodeA);
      @nodeList.addNode(@nodeB);
      @newLink =
        terminalKey: () -> 'newLink'
        sourceNode: @nodeA
        targetNode: @nodeB
      @otherNewLink =
        terminalKey: () -> 'otherNewLink'
        sourceNode: @nodeB
        targetNode: @nodeA

    describe "addLink", () ->
      describe "When the link doesn't already exist", () ->
        it "should add a new link", () ->
          should.not.exist @nodeList.linkKeys['newLink']
          @nodeList.addLink(@newLink).should.equal(true)
          @nodeList.addLink(@otherNewLink).should.equal(true)
          @nodeList.linkKeys['newLink'].should.equal(@newLink)
          @nodeList.linkKeys['otherNewLink'].should.equal(@otherNewLink)
      describe "When the link does already exist", () ->
        beforeEach () ->
          @nodeList.linkKeys['newLink'] = 'oldValue'
        it "should not add the new link", () ->
          @nodeList.addLink(@newLink).should.equal(false)
          @nodeList.linkKeys['newLink'].should.equal('oldValue')
           
         

