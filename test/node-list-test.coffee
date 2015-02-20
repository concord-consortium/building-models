expect = require('chai').expect
should = require('chai').should()
NodeList = require('../app/javascripts/node-list').NodeList
GraphPrimitive = require('../app/javascripts/node-list').GraphPrimitive
Link = require('../app/javascripts/node-list').Link
Node = require('../app/javascripts/node-list').Node

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
    
    describe 'of a Node', () ->
      it 'should increment the counter, and use the type name (Node)', () ->
        undertest = new Node()
        undertest.id.should.equal('Node-1')

describe 'Node', () ->
  beforeEach () ->
    @node_a = new Node()
    @node_b = new Node()
    @node_c = new Node()

  ###
    Note Cycle in A <-> B
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
        sourceNode: @node_a
        targetNode: @node_b
      
      @link_b = new Link
        sourceNode: @node_a
        targetNode: @node_c
      
      @link_c = new Link
        sourceNode: @node_b
        targetNode: @node_a
      
      @link_without_a = new Link
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
          @node_a.addLink(@link_d)
        describe 'In Links', () ->
          it "should have 1 in link", () ->
            @node_a.inLinks().should.have.length(1)
        
        describe 'outLinks', () ->  
          it "should have 2 outlinks", () ->
            @node_a.outLinks().should.have.length(2)

        describe 'downstreamNodes', () ->
          it "should have some nodes", () ->
            @node_a.downstreamNodes().should.have.length(2)
