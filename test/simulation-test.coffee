global._   = require 'lodash'
global.log = require 'loglevel'

chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"

Link           = requireModel 'link'
Node           = requireModel 'node'
Simulation     = requireModel 'simulation'
Relationship       = requireModel 'relationship'

LinkNodes = (sourceNode, targetNode, formula) ->
  link = new Link
    title: "function"
    sourceNode: sourceNode
    targetNode: targetNode
    relation: new Relationship
      formula: formula
  sourceNode.addLink(link)
  targetNode.addLink(link)

describe "Simulation", ->
  beforeEach ->
    @nodes     = []
    @arguments =
      nodes: @nodes
      timeStep: 0.5
      duration: 5
  it "the class should exist", ->
    Simulation.should.be.defined

  describe "the constructor", ->
    beforeEach ->
      @simulation = new Simulation(@arguments)

    it "makes a configured instance", ->
      @simulation.timeStep.should.equal @arguments.timeStep
      @simulation.duration.should.equal @arguments.duration
      @simulation.nodes.should.equal @arguments.nodes

  describe "run", ->
    describe "for a simple graph A(10) -0.1-> B(0) for 10 itterations", ->
      beforeEach ->
        @nodeA    = new Node({initialValue: 10})
        @nodeB    = new Node({initialValue: 0 })
        @formula  = "out + 0.1 * in"
        @arguments =
          nodes: [@nodeA, @nodeB]
          timeStep: 1
          duration: 10

        LinkNodes(@nodeA, @nodeB, @formula)
        @simulation = new Simulation(@arguments)

      it "the link formula should work", ->
        @nodeB.inLinks().length.should.equal 1

      describe "the result", ->
        it "should give B 10 at the end", ->
          @simulation.run()
          @nodeB.currentValue.should.equal 10

    describe "for other two-node scenarios", ->
      beforeEach ->
        @scenarios = [
          {
            startA:   10
            startB:   0
            formula:  "in * 2"
            duration: 10
            timeStep: 0.2
            result:   20
          }
          {
            startA:   10
            startB:   20
            formula:  "in * 2"
            duration: 10
            timeStep: 0.2
            result:   20
          }
          {
            startA:   10
            startB:   1
            formula:  "out + out"
            duration: 8
            timeStep: 1
            result:   256
          }
          {
            startA:   10
            startB:   1
            formula:  "out + out"
            duration: 4
            timeStep: 0.5
            result:   256
          }
        ]
      describe "each scenario", ->
        it "should compute correctly", ->
          _.each @scenarios, (scenario) ->
            nodeA = new Node({initialValue: scenario.startA})
            nodeB = new Node({initialValue: scenario.startB})
            LinkNodes(nodeA, nodeB, scenario.formula)
            simulation = new Simulation
              nodes: [nodeA, nodeB]
              timeStep: scenario.timeStep
              duration: scenario.duration
            simulation.run()
            nodeB.currentValue.should.equal scenario.result

    describe "for a simple three node graph", ->
      beforeEach ->
        @nodeA    = new Node({initialValue: 10})
        @nodeB    = new Node({initialValue: 20})
        @nodeC    = new Node({initialValue: 0 })
        @formula  = "in"
        @arguments =
          nodes: [@nodeA, @nodeB, @nodeC]
          timeStep: 1
          duration: 10

        LinkNodes(@nodeA, @nodeC, @formula)
        LinkNodes(@nodeB, @nodeC, @formula)
        @simulation = new Simulation(@arguments)
        @simulation.run()

      describe "nodeA", ->
        it "should be unaffected", ->
          @nodeA.currentValue.should.equal 10

      describe "nodeB", ->
        it "should be unaffected", ->
          @nodeB.currentValue.should.equal 20

      describe "nodeC", ->
        it "should average its imputs", ->
          @nodeC.currentValue.should.equal 15


    describe "for a three node cascade", ->
      beforeEach ->
        @nodeA    = new Node({initialValue: 10})
        @nodeB    = new Node({initialValue: 20})
        @nodeC    = new Node({initialValue: 0 })
        @formula  = "in"
        LinkNodes(@nodeA, @nodeB, @formula)
        LinkNodes(@nodeB, @nodeC, @formula)

        @arguments =
          nodes: [@nodeA, @nodeB, @nodeC]
          timeStep: 1
          duration: 1

      describe "after one step", ->
        beforeEach ->
          @arguments.duration = 1
          @simulation = new Simulation(@arguments)
          @simulation.run()

        describe "nodeA", ->
          it "should be unaffected", ->
            @nodeA.currentValue.should.equal @nodeA.initialValue

        describe "nodeB", ->
          it "should be get A's previous value", ->
            @nodeB.currentValue.should.equal @nodeA.initialValue

        describe "nodeC", ->
          it "should get B's previous value", ->
            @nodeC.currentValue.should.equal @nodeB.initialValue

      describe "after two steps", ->
        beforeEach ->
          @arguments.duration = 2
          @simulation = new Simulation(@arguments)
          @simulation.run()

        describe "nodeA", ->
          it "should be unaffected", ->
            @nodeA.currentValue.should.equal @nodeA.initialValue

        describe "nodeB", ->
          it "should be get A's previous value", ->
            @nodeB.currentValue.should.equal @nodeA.initialValue

        describe "nodeC", ->
          it "should get A's original value", ->
            @nodeC.currentValue.should.equal @nodeA.initialValue
