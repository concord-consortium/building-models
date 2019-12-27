const _ = require("lodash");

const g = global as any;

g.window = { location: "" };
g.window.performance = {
  now() {
    return Date.now();
  }
};
g.requestAnimationFrame = callback => setTimeout(callback, 1);

import * as chai from "chai";
chai.config.includeStack = true;

const { expect }         = chai;

import { Link } from "../src/code/models/link";
import { Node } from "../src/code/models/node";
import { TransferModel } from "../src/code/models/transfer";
import { SimulationV1 } from "../src/code/models/simulation-v1";
import { Relationship } from "../src/code/models/relationship";
import { RelationFactory } from "../src/code/models/relation-factory";

import { GraphStore } from "../src/code/stores/graph-store";
import { SimulationStore, SimulationActions } from "../src/code/stores/simulation-store";

const CodapHelper = require("./codap-helper");

const LinkNodes = (sourceNode, targetNode, relationSpec) => {
  const link = new Link({
    title: "function",
    sourceNode,
    targetNode,
    relation: new Relationship(relationSpec)
  });
  sourceNode.addLink(link);
  targetNode.addLink(link);
  if (link.relation.type === "transfer") {
    link.transferNode = new TransferModel({});
    link.transferNode.setTransferLink(link);
  }
  return link;
};

const asyncListenTest = (done, action, func) => {
  const stopListening = action.listen(function(args) { // tslint:disable-line:only-arrow-functions
    try {
      func.apply(null, arguments);
      done();
    } catch (ex) {
      done(ex);
    }
    stopListening();
  });
};

describe("Simulation", () => {
  beforeEach(() => {
    this.nodes     = [];
    this.arguments = {
      nodes: this.nodes,
      duration: 5
    };
  });

  describe("the constructor", () => {
    beforeEach(() => {
      this.simulation = new SimulationV1(this.arguments);
    });

    it("makes a configured instance", () => {
      this.simulation.duration.should.equal(this.arguments.duration);
      this.simulation.nodes.should.equal(this.arguments.nodes);
    });
  });

  describe("run", () => {
    describe("for a simple graph A(10) -0.1-> B(0) for 10 iterations", () => {
      beforeEach(() => {
        this.nodeA    = new Node({initialValue: 10});
        this.nodeB    = new Node({initialValue: 0 });
        this.formula  = "0.1 * in";
        this.arguments = {
          nodes: [this.nodeA, this.nodeB],
          duration: 10
        };

        LinkNodes(this.nodeA, this.nodeB, { type: "range", formula: this.formula });
        this.simulation = new SimulationV1(this.arguments);
      });

      it("the link formula should work", () => {
        this.nodeB.inLinks().length.should.equal(1);
      });

      describe("the result", () =>
        it("should give B 10 at the end", () => {
          this.simulation.run();
          this.nodeB.currentValue.should.equal(1);
        })
      );
    });

    // We can describe each scenario as an object:
    // Each single-letter key is a node.
    // Values can be:
    //  * `20` (number for independent variables)
    //  * `x+` (string for initial value for collectors)
    //  * `x*` (string for initial value when nodes uses`product` for `combineMethod`)
    //  * null (dependent variables).
    // Each two-letter node is a link, with the formula for the link.
    // Results is an array of arbitrary length, describing the expected result for each
    // node on each step.
    describe("for other scenarios", () => {
      const scenarios = [
        // 0: unlinked nodes should retain their initial values
        {A: 0, B: 50, C: 100, D: "0+", E: "50+", F: "100+",
        results: [
          [0, 50, 100, 0, 50, 100],
          [0, 50, 100, 0, 50, 100]
        ]},

        // 1: cascade independent and dependent variables (A->B->C)
        {A: 50, B: 40, C: 30, AB: "1 * in", BC: "0.1 * in",
        results: [
          [50, 50, 5],
          [50, 50, 5]
        ]},

        // 2: cascade independent and dependent variables with negative relationship (A->B->C)
        {A: 50, B: 40, C: 30, AB: "0.1 * in", BC: "-1 * in",
        results: [
          [50, 5, -5],
          [50, 5, -5]
        ]},

        // 3: basic collector (A->[B])
        {A: 5, B: "50+", AB: "1 * in",
        results: [
          [5, 50],
          [5, 55],
          [5, 60]
        ]},

        // 4: basic collector with feedback (A<->[B])
        {A: 10, B: "50+", AB: "1 * in", BA: "1 * in",
        results: [
          [50, 50],
          [100, 100],
          [200, 200]
        ]},

        // 5: three-node graph (>-) with averaging
        {A: 10, B: 20, C: null, AC: "1 * in", BC: "1 * in",
        results: [
          [10, 20, 15],
          [10, 20, 15]
        ]},

        // 6: three-node graph (>-) with non-linear averaging
        {A: 10, B: 20, C: null, AC: "1 * in", BC: "0.1 * in",
        results: [
          [10, 20, 6],
          [10, 20, 6]
        ]},

        // 7: three-node graph with collector (>-[C])
        {A: 10, B: 20, C: "0+", AC: "1 * in", BC: "0.1 * in",
        results: [
          [10, 20, 0],
          [10, 20, 12],
          [10, 20, 24]
        ]},

        // 8: three-node graph with collector (>-[C]) and negative relationship
        {A: 10, B: 1, C: "0+", AC: "1 * in", BC: "-1 * in",
        results: [
          [10, 1, 0],
          [10, 1, 9],
          [10, 1, 18]
        ]},

        // 9: four-node graph with collector (>-[D]) and scaled product combination
        {A: 50, B: 50, C: "0*", D: "0+", AC: "1 * in", BC: "1 * in", CD: "1 * in",
        results: [
          [50, 50, 25, 0],
          [50, 50, 25, 25],
          [50, 50, 25, 50]
        ]},

        // *** Tests for graphs with bounded ranges ***
        // Note most nodes have min:0 and max:100 by default
        // But collectors have a default max of 1000
        // 10: basic collector (A->[B])
        {A: 30, B: "900+", AB: "1 * in",
        cap: true,
        results: [
          [30, 900],
          [30, 930],
          [30, 960],
          [30, 990],
          [30, 1000]
        ]},

        // 11: basic subtracting collector (A- -1 ->[B])
        {A: 40, B: "90+", AB: "-1 * in",
        cap: true,
        results: [
          [40, 90],
          [40, 50],
          [40, 10],
          [40, 0]
        ]},

        // 12: basic independent and dependent nodes (A->B)
        {A: 120, B: 0, AB: "1 * in",
        cap: true,
        results: [
          [100, 100]
        ]},

        // *** Collector initial-value tests ***

        // 13: (A-init->B+)
        {A: 10, B: "50+", AB: "initial-value",
        results: [
          [10, 10],
          [10, 10]
        ]},

        // 14: A and B averageing initial values >- (A-init->C+, B-init->C+)
        {A: 10, B: 20, C: "50+", AC: "initial-value", BC: "initial-value",
        results: [
          [10, 20, 15],
          [10, 20, 15]
        ]},

        // 15: Setting initial values, and accumulating >- (A-init->C+, B->C+)
        {A: 10, B: 20, C: "50+", AC: "initial-value", BC: "1 * in",
        results: [
          [10, 20, 10],
          [10, 20, 30]
        ]}
      ];

      _.each(scenarios, (scenario, i) =>
        it(`should compute scenario ${i} correctly`, () => {
          let key, node;
          const nodes = {};
          for (key in scenario) {
            let isAccumulator;
            const value = scenario[key];
            if (key.length === 1) {
              isAccumulator = (typeof value === "string") && ~value.indexOf("+"); // tslint:disable-line:no-bitwise
              const isProduct = (typeof value === "string") && ~value.indexOf("*"); // tslint:disable-line:no-bitwise
              const combineMethod = isProduct ? "product" : "average";
              nodes[key] = new Node({title: key, initialValue: parseInt(value, 10), combineMethod, isAccumulator});
            } else if (key.length === 2) {
              let type;
              const node1 = nodes[key[0]];
              const node2 = nodes[key[1]];
              let func;
              if (node2.isAccumulator) {
                type = value === "initial-value" ? value : "accumulator";
                if (type === "initial-value") { func = () => ({}); }
              } else {
                type = "range";
              }
              LinkNodes(node1, node2, { type, formula: value, func });
            }
          }
          for (let j = 0; j < scenario.results.length; j++) {
            const result = scenario.results[j];
            const nodeArray: Node[] = [];
            for (key in nodes) {
              node = nodes[key];
              nodeArray.push(node);
            }
            const simulation = new SimulationV1({
              nodes: nodeArray,
              duration: j + 1,
              capNodeValues: scenario.cap === true
            });

            if (result === false) {
              expect(simulation.run.bind(simulation)).to.throw("Graph not valid");
            } else {
              simulation.run();
              for (let k = 0; k < nodeArray.length; k++) {
                node = nodeArray[k];
                expect(node.currentValue, `Step: ${j}, Node: ${node.title}`).to.be.closeTo(result[k], 0.000001);
              }
            }
          }
        })
      );
    });

    describe("for mixed semiquantitative and quantitative nodes", () => {
      beforeEach(() => {
        this.nodeA    = new Node({initialValue: 20});
        this.nodeB    = new Node({initialValue: 50});
        this.formula  = "1 * in";
        this.arguments = {
          nodes: [this.nodeA, this.nodeB],
          duration: 1
        };

        LinkNodes(this.nodeA, this.nodeB, { type: "range", formula: this.formula });
        this.simulation = new SimulationV1(this.arguments);
      });

      describe("when the input is SQ and the output is Q", () => {
        beforeEach(() => {
          this.nodeA.valueDefinedSemiQuantitatively = true;
          this.nodeB.valueDefinedSemiQuantitatively = false;
        });

        // sanity check
        it("should be no different when both have the same range", () => {
          this.simulation.run();
          this.nodeB.currentValue.should.equal(20);
        });

        it("should scale between output's min and max", () => {
          this.nodeB.min = 50;
          this.nodeB.max = 100;
          this.simulation.run();
          this.nodeB.currentValue.should.equal(60);
        });
      });

      describe("when the input is Q and the output is SQ", () => {
        beforeEach(() => {
          this.nodeA.valueDefinedSemiQuantitatively = false;
          this.nodeB.valueDefinedSemiQuantitatively = true;
        });

        // sanity check
        it("should be no different when both have the same range", () => {
          this.simulation.run();
          this.nodeB.currentValue.should.equal(20);
        });

        it("should scale between output's min and max", () => {
          this.nodeA.min = 0;
          this.nodeA.max = 50;
          this.simulation.run();
          this.nodeB.currentValue.should.equal(40);
        });
      });
    });

    describe("for transfer nodes", () => {
      beforeEach(() => {
        this.nodeA    = new Node({title: "A", isAccumulator: true, initialValue: 100});
        this.nodeB    = new Node({title: "B", isAccumulator: true, initialValue: 50});
        this.transferLink = LinkNodes(this.nodeA, this.nodeB, RelationFactory.transferred);
        this.transferNode = this.transferLink.transferNode;
        this.arguments = {
          nodes: [this.nodeA, this.nodeB, this.transferNode],
          duration: 2
        };

        this.simulation = new SimulationV1(this.arguments);
      });

      describe("should transfer appropriate amount from the source node to the target node", () => {

        // sanity check
        it("should transfer (transwerNode.initialValue 50) to B with no transfer-modifier", () => {
          this.transferNode.initialValue = 50;
          this.simulation.run();
          expect(this.nodeA.currentValue, `Node: ${this.nodeA.title}`).to.be.closeTo(50, 0.000001);
          expect(this.nodeB.currentValue, `Node: ${this.nodeB.title}`).to.be.closeTo(100, 0.000001);
        });

        // sanity check
        it("should transfer (transwerNode.initialValue 80) to B with no transfer-modifier", () => {
          this.transferNode.initialValue = 80;
          this.simulation.run();
          expect(this.nodeA.currentValue, `Node: ${this.nodeA.title}`).to.be.closeTo(20, 0.000001);
          expect(this.nodeB.currentValue, `Node: ${this.nodeB.title}`).to.be.closeTo(130, 0.000001);
        });

        // sanity check
        it("should limit the transfer to the quantity in the source node", () => {
          this.nodeA.initialValue = 5;
          this.nodeA.capNodeValues = (this.nodeB.capNodeValues = true);
          this.simulation.duration = 12;
          this.simulation.run();
          expect(this.nodeA.currentValue, `Node: ${this.nodeA.title}`).to.be.closeTo(0, 0.000001);
          expect(this.nodeB.currentValue, `Node: ${this.nodeB.title}`).to.be.closeTo(55, 0.000001);
        });

        // sanity check
        // transfer 10% of source (2) per step. 20 - 2 = 18 ,  50 + 2 = 52
        it("should transfer the appropriate percentage of the source node with a transfer-modifer", () => {
          this.nodeA.initialValue = 20;
          this.transferModifier = LinkNodes(this.nodeA, this.transferNode, RelationFactory.proportionalSourceMore);
          this.simulation.duration = 2;
          this.simulation.run();
          expect(this.nodeA.currentValue, `Node: ${this.nodeA.title}`).to.be.closeTo(18, 0.000001);
          expect(this.nodeB.currentValue, `Node: ${this.nodeB.title}`).to.be.closeTo(52, 0.000001);
        });
      });
    });
  });
});


describe("The SimulationStore, with a network in the GraphStore", () => {
  beforeEach(() => {
    CodapHelper.Stub();

    this.nodeA    = new Node({title: "A", initialValue: 10});
    this.nodeB    = new Node({title: "B", initialValue: 0 });
    this.formula  = "0.1 * in";

    GraphStore.init();

    GraphStore.addNode(this.nodeA);
    GraphStore.addNode(this.nodeB);

    LinkNodes(this.nodeA, this.nodeB, { type: "range", formula: this.formula });
  });

  afterEach(() => CodapHelper.UnStub());

  describe("for a fast simulation for 10 iterations", () => {

    beforeEach(() => {
      SimulationStore.settings.experimentFrame = 0;
      SimulationActions.setDuration.trigger(10);
      SimulationActions.expandSimulationPanel.trigger();
    });

    it("should start simulation when experiment is created", (done) => {

      asyncListenTest(done, SimulationActions.simulationStarted, (nodeNames) => {
        nodeNames.length.should.equal(2);
      });

      SimulationActions.createExperiment();
    });

    it("should call recordingDidStart with the node names", (done) => {
      asyncListenTest(done, SimulationActions.recordingDidStart, nodeNames => nodeNames.should.eql(["A", "B"]));

      SimulationActions.createExperiment();
      SimulationActions.recordPeriod();
    });

    it("should call simulationFramesCreated with all the step values", (done) => {

      asyncListenTest(done, SimulationActions.recordingFramesCreated, (data) => {

          data.length.should.equal(10);

          const frame0 = data[0];
          frame0.time.should.equal(1);
          frame0.nodes.should.eql([ { title: "A", value: 10 }, { title: "B", value: 1 } ]);

          const frame9 = data[9];
          frame9.time.should.equal(10);
          frame9.nodes.should.eql([ { title: "A", value: 10 }, { title: "B", value: 1 } ]);
      });

      SimulationActions.createExperiment();
      SimulationActions.recordPeriod();
    });
  });

  describe("for a slow simulation for 3 iterations", () => {

    beforeEach(() => {
      SimulationActions.setDuration.trigger(3);
      SimulationActions.expandSimulationPanel.trigger();
    });
    it("should call simulationFramesCreated with 3 frames", (done) => {
      const testFunction = (data) => {
        const size = data.length;
        size.should.eql(3);
      };

      asyncListenTest(done, SimulationActions.recordingFramesCreated, testFunction);
      SimulationActions.recordPeriod();
    });
  });
});



