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
    describe "for a simple graph A(10) -0.1-> B(0) for 10 iterations", ->
      beforeEach ->
        @nodeA    = new Node({initialValue: 10})
        @nodeB    = new Node({initialValue: 0 })
        @formula  = "0.1 * in"
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
          @nodeB.currentValue.should.equal 1

    describe "for other two-node scenarios", ->
      beforeEach ->
        @scenarios = [
          # basic accumulator
          {
            startA:   10
            startB:   0
            bIsAccumulator: true
            formula:  "1 * in"
            duration: 10
            timeStep: 1
            result:   100
          }
          # basic accumulator implicitly defined using 'out'
          {
            startA:   10
            startB:   0
            formula:  "out + 1 * in"
            duration: 10
            timeStep: 1
            result:   100
          }
          # basic accumulator with an initial value
          {
            startA:   10
            startB:   50
            bIsAccumulator: true
            formula:  "1 * in"
            duration: 10
            timeStep: 1
            result:   150
          }
          # accumulator with a negative relationship
          {
            startA:   10
            startB:   0
            bIsAccumulator: true
            formula:  "-0.1 * in"
            duration: 10
            timeStep: 1
            result:   -10
          }
          # basic non-accumulator with a negative relationship
          {
            startA:   10
            startB:   0
            formula:  "in * -0.1"
            duration: 10
            timeStep: 1
            result:   -1
          }
          # odder examples...
          {
            startA:   10
            startB:   0
            formula:  "in * 2"
            duration: 10
            timeStep: 0.2
            result:   4
          }
          {
            startA:   10
            startB:   20
            formula:  "in * 2"
            duration: 10
            timeStep: 0.2
            result:   4
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
            result:   1
          }
        ]
      describe "each scenario", ->
        it "should compute correctly", ->
          _.each @scenarios, (scenario) ->
            nodeA = new Node({initialValue: scenario.startA})
            nodeB = new Node({initialValue: scenario.startB, isAccumulator: scenario.bIsAccumulator})
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

    describe "for other three-node scenarios, A->C and B->C", ->
      beforeEach ->
        @scenarios = [
          # basic non-accumulator
          {
            startA:   10
            startB:   5
            startC:   0
            formulaA:  "1 * in"
            formulaB:  "1 * in"
            duration: 10
            timeStep: 1
            result:   7.5
          }
          # basic accumulator
          {
            startA:   10
            startB:   1
            startC:   0
            cIsAccumulator: true
            formulaA:  "1 * in"
            formulaB:  "1 * in"
            duration: 10
            timeStep: 1
            result:   110
          }
          # basic accumulator with one negative relationship
          {
            startA:   10
            startB:   1
            startC:   0
            cIsAccumulator: true
            formulaA:  "1 * in"
            formulaB:  "-1 * in"
            duration: 10
            timeStep: 1
            result:   90
          }
        ]
      describe "each scenario", ->
        it "should compute correctly", ->
          _.each @scenarios, (scenario) ->
            nodeA = new Node({initialValue: scenario.startA})
            nodeB = new Node({initialValue: scenario.startB})
            nodeC = new Node({initialValue: scenario.startC, isAccumulator: scenario.cIsAccumulator})
            LinkNodes(nodeA, nodeC, scenario.formulaA)
            LinkNodes(nodeB, nodeC, scenario.formulaB)
            simulation = new Simulation
              nodes: [nodeA, nodeB, nodeC]
              timeStep: scenario.timeStep
              duration: scenario.duration
            simulation.run()
            nodeC.currentValue.should.equal scenario.result



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
          it "should get A's previous value", ->
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
          it "should get A's previous value", ->
            @nodeB.currentValue.should.equal @nodeA.initialValue

        describe "nodeC", ->
          it "should get A's original value", ->
            @nodeC.currentValue.should.equal @nodeA.initialValue

  describe "report", ->
    describe "for a simple graph A(10) -0.1-> B(0) for 10 iterations", ->
      beforeEach ->
        @nodeA    = new Node({name: "A", initialValue: 10})
        @nodeB    = new Node({name: "B", initialValue: 0 })
        @formula  = "out + 0.1 * in"
        @report   = null
        @arguments =
          nodes: [@nodeA, @nodeB]
          timeStep: 1
          duration: 10
          reportFunc: (report) =>
            @report = report

        LinkNodes(@nodeA, @nodeB, @formula)
        @simulation = new Simulation(@arguments)
        @simulation.run()
        @report = @simulation.report()

      describe "the report generated", ->

        it "should exist", ->
          @report.should.exist

        it "should have some simulation details", ->
          @report.should.exist
          @report.steps.should.equal 10
          @report.duration.should.equal 10
          @report.timeStep.should.equal 1
          @report.nodeNames.length.should.equal 2

        describe "the simulation frames", ->
          beforeEach ->
            @frames = @report.frames
            @firstFrame = @frames[0]
            @lastFrame = @frames[9]

          it "should have frames", ->
            @frames.should.exist
            @firstFrame.should.exist
            @firstFrame.time.should.equal 1
            @lastFrame.should.exist
            @lastFrame.time.should.equal 10

            @firstFrame.nodes.should.have.length 2
            @firstFrame.nodes[0].value.should.equal 10
            @firstFrame.nodes[1].value.should.equal 1

            @lastFrame.nodes.should.have.length 2
            @lastFrame.nodes[0].value.should.equal 10
            @lastFrame.nodes[1].value.should.equal 10

        describe "the codap transformation", ->
          beforeEach ->
            @codapData = _.map @report.frames, (frame) ->
              data       = [frame.time]
              _.each frame.nodes, (n) -> data.push n.value
              data

          describe "the number of samples", ->
            it "should have 10", ->
              @codapData.length.should.equal 10

          describe "the format of the last sample", ->
            beforeEach ->
              @lastFrame = @codapData[0]

            it "should be have 3 elements (time,nodeA, nodeB)", ->
              @lastFrame.should.have.length 3

            it "should be a numeric property", ->
              @lastFrame[0].should.be.a('number')
              @lastFrame[0].should.equal 1
              @lastFrame[1].should.equal 10
              @lastFrame[2].should.equal 1
