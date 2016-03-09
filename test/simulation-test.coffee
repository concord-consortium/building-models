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

Link           = requireModel 'link'
Node           = requireModel 'node'
Simulation     = requireModel 'simulation'
Relationship   = requireModel 'relationship'

requireStore = (name) -> require "#{__dirname}/../src/code/stores/#{name}"

GraphStore        = requireStore('graph-store').store
SimulationActions = requireStore('simulation-store').actions

CodapConnect   = requireModel 'codap-connect'


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
      duration: 5
  it "the class should exist", ->
    Simulation.should.be.defined

  describe "the constructor", ->
    beforeEach ->
      @simulation = new Simulation(@arguments)

    it "makes a configured instance", ->
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
          duration: 10

        LinkNodes(@nodeA, @nodeB, @formula)
        @simulation = new Simulation(@arguments)

      it "the link formula should work", ->
        @nodeB.inLinks().length.should.equal 1

      describe "the result", ->
        it "should give B 10 at the end", ->
          @simulation.run()
          @nodeB.currentValue.should.equal 1

    # We can describe each scenario as an object:
    # Each single-letter key is a node. Values can be a number (the initial value
    #   for independent variables), a string "x+" (the initial value for collectors),
    #   or null (dependent variables).
    # Each two-letter node is a link, with the formula for the link.
    # Results is an array of arbitrary length, describing the expected result for each
    # node on each step.
    describe "for other scenarios", ->
      scenarios = [
        # 0: cascade independent and dependent variables (A->B->C)
        {A: 50, B: 40, C: 30, AB: "1 * in", BC: "0.1 * in",
        results: [
            [50, 50, 5]
            [50, 50, 5]
        ]}

        # 1: cascade independent and dependent variables with negative relationship (A->B->C)
        {A: 50, B: 40, C: 30, AB: "0.1 * in", BC: "-1 * in",
        results: [
            [50, 5, -5]
            [50, 5, -5]
        ]}

        # 2: basic collector (A->[B])
        {A:5, B:"50+", AB: "1 * in",
        results: [
          [5, 50]
          [5, 55]
        ]}

        # 3: basic collector with feedback (A<->[B])
        {A:10, B:"50+", AB: "1 * in", BA: "1 * in",
        results: [
          [50, 50]
          [100, 100]
          [200, 200]
        ]}

        # 4: three-node graph (>-) with averaging
        {A: 10, B: 20, C: null, AC: "1 * in", BC: "1 * in",
        results: [
            [10, 20, 15]
            [10, 20, 15]
        ]}

        # 5: three-node graph (>-) with non-linear averaging
        {A: 10, B: 20, C: null, AC: "1 * in", BC: "0.1 * in",
        results: [
            [10, 20, 6]
            [10, 20, 6]
        ]}

        # 6: three-node graph with collector (>-[C])
        {A: 10, B: 20, C: "0+", AC: "1 * in", BC: "0.1 * in",
        results: [
            [10, 20, 0]
            [10, 20, 12]
        ]}

        # 7: three-node graph with collector (>-[C]) and negative relationship
        {A: 10, B: 1, C: "0+", AC: "1 * in", BC: "-1 * in",
        results: [
            [10, 1, 0]
            [10, 1, 9]
            [10, 1, 18]
        ]}

        # *** Tests for graphs with bounded ranges ***
        # Note all nodes have min:0 and max:100 by default

        # 8: basic collector (A->[B])
        {A:30, B:"50+", AB: "1 * in",
        cap: true
        results: [
          [30, 50]
          [30, 80]
          [30, 100]
        ]}

        # 9: basic subtracting collector (A- -1 ->[B])
        {A:30, B:"50+", AB: "-1 * in",
        cap: true
        results: [
          [30, 50]
          [30, 20]
          [30, 0]
        ]}

        # 10: basic independent and dependent nodes (A->B)
        {A:120, B:0, AB: "1 * in",
        cap: true
        results: [
          [120, 100]
        ]}
      ]

      _.each scenarios, (scenario, i) ->
        it "should compute scenario #{i} correctly", ->
          nodes = {}
          for key, value of scenario
            if key.length == 1
              isAccumulator = typeof value is "string" and ~value.indexOf('+')
              nodes[key] = new Node({initialValue: parseInt(value), isAccumulator})
            else if key.length == 2
              node1 = nodes[key[0]]
              node2 = nodes[key[1]]
              LinkNodes(node1, node2, value)
          for result, j in scenario.results
            nodeArray = (node for key, node of nodes)
            simulation = new Simulation
              nodes: nodeArray
              duration: j+1
              capNodeValues: scenario.cap is true
              newIntegration: scenario.newInt is true

            if result is false
              expect(simulation.run.bind(simulation)).to.throw "Graph not valid"
            else
              simulation.run()
              for node, k in nodeArray
                node.currentValue.should.be.closeTo result[k], 0.000001

    describe "for mixed semiquantitative and quantitative nodes", ->
      beforeEach ->
        @nodeA    = new Node({initialValue: 20})
        @nodeB    = new Node({initialValue: 50})
        @formula  = "1 * in"
        @arguments =
          nodes: [@nodeA, @nodeB]
          duration: 1

        LinkNodes(@nodeA, @nodeB, @formula)
        @simulation = new Simulation(@arguments)

      describe "when the input is SQ and the output is Q", ->
        beforeEach ->
          @nodeA.valueDefinedSemiQuantitatively = true
          @nodeB.valueDefinedSemiQuantitatively = false

        # sanity check
        it "should be no different when both have the same range", ->
          @simulation.run()
          @nodeB.currentValue.should.equal 20

        it.only "should scale between output's min and max", ->
          @nodeB.min = 50
          @nodeB.max = 100
          @simulation.run()
          @nodeB.currentValue.should.equal 60

      describe "when the input is Q and the output is SQ", ->
        beforeEach ->
          @nodeA.valueDefinedSemiQuantitatively = false
          @nodeB.valueDefinedSemiQuantitatively = true

        # sanity check
        it "should be no different when both have the same range", ->
          @simulation.run()
          @nodeB.currentValue.should.equal 20

        it.only "should scale between output's min and max", ->
          @nodeA.min = 0
          @nodeA.max = 50
          @simulation.run()
          @nodeB.currentValue.should.equal 40


describe "The SimulationStore, with a network in the GraphStore", ->
  beforeEach ->
    sandbox = Sinon.sandbox.create()
    sandbox.stub(CodapConnect, "instance", ->
      return {
        sendUndoableActionPerformed: -> return ''
      }
    )

    @nodeA    = new Node({title: "A", initialValue: 10})
    @nodeB    = new Node({title: "B", initialValue: 0 })
    @formula  = "0.1 * in"

    GraphStore.init()

    GraphStore.addNode @nodeA
    GraphStore.addNode @nodeB

    LinkNodes(@nodeA, @nodeB, @formula)

  afterEach ->
    CodapConnect.instance.restore()

  describe "for a fast simulation for 10 iterations", ->

    beforeEach ->
      SimulationActions.resetSimulation.trigger()
      SimulationActions.setSpeed.trigger(4)
      SimulationActions.setDuration.trigger(10)


    it "should call simulationStarted with the node names", (done) ->
      # calledback is an annoyance to prevent later tests from triggering this
      # listener again, and raising multiple-done() Mocha error
      calledback = false

      SimulationActions.simulationStarted.listen (nodeNames) ->
        if not calledback
          nodeNames.should.eql ["A", "B"]
          done()
        calledback = true

      SimulationActions.runSimulation()

    it "should call simulationFramesCreated with all the step values", (done) ->
      calledback = false
      SimulationActions.simulationFramesCreated.listen (data) ->
        if not calledback
          data.length.should.equal 10

          frame0 = data[0]
          frame0.time.should.equal 1
          frame0.nodes.should.eql [ { title: 'A', value: 10 }, { title: 'B', value: 1 } ]

          frame9 = data[9]
          frame9.time.should.equal 10
          frame9.nodes.should.eql [ { title: 'A', value: 10 }, { title: 'B', value: 1 } ]

          done()

        calledback = true

      SimulationActions.runSimulation()

  describe "for a slow simulation for 3 iterations", ->

    beforeEach ->
      SimulationActions.resetSimulation()
      SimulationActions.setDuration.trigger(3)
      SimulationActions.setSpeed.trigger(3)

    it "should call simulationFramesCreated several times, with 3 frames total", (done) ->
      totalCallbacks = 0
      totalFrames = 0
      SimulationActions.simulationFramesCreated.listen (data) ->
        totalCallbacks++
        totalFrames += data.length

      SimulationActions.simulationEnded.listen ->
        expect(totalFrames).to.equal 3
        expect(totalCallbacks).to.be.above 1
        done()

      SimulationActions.runSimulation()
