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
TransferNode   = requireModel 'transfer'
Simulation     = requireModel 'simulation'
Relationship   = requireModel 'relationship'
RelationFactory = requireModel 'relation-factory'

requireStore = (name) -> require "#{__dirname}/../src/code/stores/#{name}"

GraphStore        = requireStore('graph-store').store
SimulationStore   = requireStore('simulation-store').store
SimulationActions = requireStore('simulation-store').actions

CodapConnect   = requireModel 'codap-connect'


LinkNodes = (sourceNode, targetNode, relationSpec) ->
  link = new Link
    title: "function"
    sourceNode: sourceNode
    targetNode: targetNode
    relation: new Relationship(relationSpec)
  sourceNode.addLink(link)
  targetNode.addLink(link)
  if link.relation.type is 'transfer'
    link.transferNode = new TransferNode
    link.transferNode.setTransferLink link
  link


asyncListenTest = (done, action, func) ->
  stopListening = action.listen (args) ->
    try
      func.apply(null, arguments)
      done()
    catch ex
      done(ex)
    stopListening()

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

        LinkNodes(@nodeA, @nodeB, { type: 'range', formula: @formula })
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
        # 0: unlinked nodes should retain their initial values
        {A: 0, B: 50, C: 100, D: "0+", E: "50+", F: "100+",
        results: [
          [0, 50, 100, 0, 50, 100]
          [0, 50, 100, 0, 50, 100]
        ]}

        # 1: cascade independent and dependent variables (A->B->C)
        {A: 50, B: 40, C: 30, AB: "1 * in", BC: "0.1 * in",
        results: [
          [50, 50, 5]
          [50, 50, 5]
        ]}

        # 2: cascade independent and dependent variables with negative relationship (A->B->C)
        {A: 50, B: 40, C: 30, AB: "0.1 * in", BC: "-1 * in",
        results: [
          [50, 5, -5]
          [50, 5, -5]
        ]}

        # 3: basic collector (A->[B])
        {A:5, B:"50+", AB: "1 * in",
        results: [
          [5, 50.05]
          [5, 50.1]
        ]}

        # 4: basic collector with feedback (A<->[B])
        {A:10, B:"50+", AB: "1 * in", BA: "1 * in",
        results: [
          [50, 50.5]
          [50.5, 51.005]
          [51.005, 51.51505]
        ]}

        # 5: three-node graph (>-) with averaging
        {A: 10, B: 20, C: null, AC: "1 * in", BC: "1 * in",
        results: [
          [10, 20, 15]
          [10, 20, 15]
        ]}

        # 6: three-node graph (>-) with non-linear averaging
        {A: 10, B: 20, C: null, AC: "1 * in", BC: "0.1 * in",
        results: [
          [10, 20, 6]
          [10, 20, 6]
        ]}

        # 7: three-node graph with collector (>-[C])
        {A: 10, B: 20, C: "0+", AC: "1 * in", BC: "0.1 * in",
        results: [
          [10, 20, 0.12]
          [10, 20, 0.24]
        ]}

        # 8: three-node graph with collector (>-[C]) and negative relationship
        {A: 10, B: 1, C: "0+", AC: "1 * in", BC: "-1 * in",
        results: [
          [10, 1, 0.09]
          [10, 1, 0.18]
          [10, 1, 0.27]
        ]}

        # 9: four-node graph with collector (>-[D]) and scaled product combination
        {A: 50, B: 50, C: 0, D: "0+", AC: "1 * in", BC: "1 * in", CD: "1 * in"
        results: [
          [50, 50, 25, 0.25]
          [50, 50, 25, 0.5]
        ]}

        # *** Tests for graphs with bounded ranges ***
        # Note all nodes have min:0 and max:100 by default

        # 10: basic collector (A->[B])
        {A:60, B:"99+", AB: "1 * in",
        cap: true
        results: [
          [60, 99.6]
          [60, 100]
          [60, 100]
        ]}

        # 11: basic subtracting collector (A- -1 ->[B])
        {A:60, B:"1+", AB: "-1 * in",
        cap: true
        results: [
          [60, 0.4]
          [60, 0]
          [60, 0]
        ]}

        # 12: basic independent and dependent nodes (A->B)
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
              nodes[key] = new Node({title: key, initialValue: parseInt(value), isAccumulator})
            else if key.length == 2
              node1 = nodes[key[0]]
              node2 = nodes[key[1]]
              type = if node2.isAccumulator then 'accumulator' else 'range'
              LinkNodes(node1, node2, { type, formula: value })
          for result, j in scenario.results
            nodeArray = (node for key, node of nodes)
            simulation = new Simulation
              nodes: nodeArray
              duration: j+1
              capNodeValues: scenario.cap is true

            if result is false
              expect(simulation.run.bind(simulation)).to.throw "Graph not valid"
            else
              simulation.run()
              for node, k in nodeArray
                expect(node.currentValue, "Step: #{j}, Node: #{node.title}").to.be.closeTo result[k], 0.000001

    describe "for mixed semiquantitative and quantitative nodes", ->
      beforeEach ->
        @nodeA    = new Node({initialValue: 20})
        @nodeB    = new Node({initialValue: 50})
        @formula  = "1 * in"
        @arguments =
          nodes: [@nodeA, @nodeB]
          duration: 1

        LinkNodes(@nodeA, @nodeB, { type: 'range', formula: @formula })
        @simulation = new Simulation(@arguments)

      describe "when the input is SQ and the output is Q", ->
        beforeEach ->
          @nodeA.valueDefinedSemiQuantitatively = true
          @nodeB.valueDefinedSemiQuantitatively = false

        # sanity check
        it "should be no different when both have the same range", ->
          @simulation.run()
          @nodeB.currentValue.should.equal 20

        it "should scale between output's min and max", ->
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

        it "should scale between output's min and max", ->
          @nodeA.min = 0
          @nodeA.max = 50
          @simulation.run()
          @nodeB.currentValue.should.equal 40

    describe "for transfer nodes", ->
      beforeEach ->
        @nodeA    = new Node({title: "A", isAccumulator: true, initialValue: 20})
        @nodeB    = new Node({title: "B", isAccumulator: true, initialValue: 50})
        @transferLink = LinkNodes(@nodeA, @nodeB, RelationFactory.transferred)
        @transferNode = @transferLink.transferNode
        @arguments =
          nodes: [@nodeA, @nodeB, @transferNode]
          duration: 1

        @simulation = new Simulation(@arguments)

      describe "should transfer appropriate mount from the source node to the target node", ->

        # sanity check
        it "should transfer 1/100th the value of the source node with no transfer-modifier", ->
          @simulation.run()
          expect(@nodeA.currentValue, "Node: #{@nodeA.title}").to.be.closeTo 19.5, 0.000001
          expect(@nodeB.currentValue, "Node: #{@nodeB.title}").to.be.closeTo 50.5, 0.000001

        # sanity check
        it "should transfer 1/100th the value of the source node with no transfer-modifier", ->
          @transferNode.initialValue = 80
          @simulation.run()
          expect(@nodeA.currentValue, "Node: #{@nodeA.title}").to.be.closeTo 19.2, 0.000001
          expect(@nodeB.currentValue, "Node: #{@nodeB.title}").to.be.closeTo 50.8, 0.000001

        # sanity check
        it "should transfer the appropriate percentage of the source node with a transfer-modifer", ->
          @transferModifier = LinkNodes(@nodeA, @transferNode, RelationFactory.half)
          @simulation.run()
          expect(@nodeA.currentValue, "Node: #{@nodeA.title}").to.be.closeTo 10, 0.000001
          expect(@nodeB.currentValue, "Node: #{@nodeB.title}").to.be.closeTo 60, 0.000001


describe "The SimulationStore, with a network in the GraphStore", ->
  beforeEach ->
    @sandbox = Sinon.sandbox.create()
    @sandbox.stub(CodapConnect, "instance", ->
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

    LinkNodes(@nodeA, @nodeB, { type: 'range', formula: @formula })

  afterEach ->
    CodapConnect.instance.restore()

  describe "for a fast simulation for 10 iterations", ->

    beforeEach ->
      SimulationActions.setDuration.trigger(10)
      SimulationActions.expandSimulationPanel.trigger()

    it "should call recordingDidStart with the node names", (done) ->
      asyncListenTest done, SimulationActions.recordingDidStart, (nodeNames) ->
        nodeNames.should.eql ["A", "B"]

      SimulationActions.createExperiment()
      SimulationActions.recordPeriod()

    it "should call simulationFramesCreated with all the step values", (done) ->

      asyncListenTest done, SimulationActions.recordingFramesCreated, (data) ->

          data.length.should.equal 10

          frame0 = data[0]
          frame0.time.should.equal 1
          frame0.nodes.should.eql [ { title: 'A', value: 10 }, { title: 'B', value: 1 } ]

          frame9 = data[9]
          frame9.time.should.equal 10
          frame9.nodes.should.eql [ { title: 'A', value: 10 }, { title: 'B', value: 1 } ]

      SimulationActions.createExperiment()
      SimulationActions.recordPeriod()

  describe "for a slow simulation for 3 iterations", ->

    beforeEach ->
      SimulationActions.setDuration.trigger(3)
      SimulationActions.expandSimulationPanel.trigger()
    it "should call simulationFramesCreated with 3 frames", (done) ->
      testFunction = (data) ->
        size = data.length
        size.should.eql(3)

      asyncListenTest done, SimulationActions.recordingFramesCreated, testFunction
      SimulationActions.recordPeriod()



