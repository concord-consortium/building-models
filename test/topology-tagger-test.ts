
// see Mocha Chai assertions: https://www.chaijs.com/api/bdd/
import { describe, afterEach, it } from "mocha";
import * as chai from "chai";
chai.config.includeStack = true;

import {
  getAnalysisGraph,
  ISageLink,
  ISageNode,
  ISageGraph,
  getTopology
} from "../src/code/utils/topology-tagger";

import { v1220data as sageData } from "./serialized-test-data/v-1.22.0";
import { threeNodesWithTransferLinks } from "./serialized-test-data/topology-test-cases/three-nodes-with-transfer-links";
import { twoUnconnectedNodes } from "./serialized-test-data/topology-test-cases/two-unconnected-nodes";
import { simpleTwoNodeGraph } from "./serialized-test-data/topology-test-cases/simple-two-node-graph";
import { simpleLinearExamples } from "./serialized-test-data/topology-test-cases/simple-linear-examples";
import { branchAndJoinExamples } from "./serialized-test-data/topology-test-cases/branch-and-join-examples";

// Draft of some behavior notes. (To be expanded.)
//
// nodeCount -- number of nodes in the Graph. Transfer links are treated as nodes (as they are
//   modeled in the sage Graph)
//
// linkCount -- number of links in the Graph. But, tranfer links are modeled in sage as a single 
//    link that connect 2 primary NodeJS, but with an extra link node that is marked as a x-fer Node
//    -- so I think this means that plain links just count as 1. But an additioal link should
//    be added for each transfer node.
//
// multiLinkTargetNodeCount
//     Hmmm... not sure if transfer links messs with this. But, it's a count of all
//     the nodes that have > 1 targets. An unconnected node can not have any targets
//     and are of no concern
//
// collectorNodeCount
//     returns the number of nodes that haeve "accumulator = true" in their data

//
// independentGraphCount
//      returns the number of unconnected graphs that contain 2 or more nodes in the model. A singleton node
//      does NOT count as a graph. An empty model contains no graphs.
//      A model with a single node contains no graphs.
//
// unconnectedNodeCount
//      returns the number of singleton nodes.
//
// linearCount (number of independent graphs in the model that are linear)
//     note: a model with no nodes is not linear
//           a single standalone node is not considered linear
//           But it does not effect the lineariy of other subgraphs
//
// feedbackGraphCount
//   not yet implmented.
//
// branchedGraphCount

// useful other counts:
//  transferNodeCount
//  cycleCount

describe("TopologyTagger", () => {
  beforeEach(() => null);
  afterEach(() => null);

  describe("converts a V22 Sage model to a graphlib graph", () => {
    it("acts like a graphlib graph", () => {
      const g = getAnalysisGraph(sageData);
      chai.expect(g).respondTo("nodeCount");
    });
    it("counts the number of nodes", () => {
      chai.expect(getTopology(sageData).nodeCount).to.eql(9);
    });
    it("counts the number of links", () => {
      chai.expect(getTopology(sageData).linkCount).to.eql(8);
    });
  });

  describe("analyzes an empty model", () => {
    const nodes: ISageNode[] = [];
    const links: ISageLink[] = [];
    const graph: ISageGraph = { nodes, links };
    it("finds no nodes", () => {
      chai.expect(getTopology(graph).nodeCount).to.eql(0);
    });
    it("finds no links", () => {
      chai.expect(getTopology(graph).linkCount).to.eql(0);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodeCount).to.eql(0);
    });
    it("finds no independent graphs", () => {
      chai.expect(getTopology(graph).independentGraphCount).to.eql(0);
    });
    it("finds no unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphCount).to.eql(0);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphCount).to.eql(0);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphCount).to.eql(0);
    });
  });

  describe("analyzes a model with a single node", () => {
    const nodes: ISageNode[] = [{ key: "singletonNode" }];
    const links: ISageLink[] = [];
    const graph: ISageGraph = { nodes, links };
    it("finds 1 nodes", () => {
      chai.expect(getTopology(graph).nodeCount).to.eql(1);
    });
    it("finds no links", () => {
      chai.expect(getTopology(graph).linkCount).to.eql(0);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodeCount).to.eql(0);
    });
    it("finds no independent graphs", () => {
      chai.expect(getTopology(graph).independentGraphCount).to.eql(0);
    });
    it("finds 1 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(1);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphCount).to.eql(0);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphCount).to.eql(0);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphCount).to.eql(0);
    });
  });

  describe("analyzes a model with a 2 unconnected nodes, 1 is a collector", () => {
    const graph: ISageGraph = twoUnconnectedNodes;
    it("finds 2 nodes", () => {
      chai.expect(getTopology(graph).nodeCount).to.eql(2);
    });
    it("finds no links", () => {
      chai.expect(getTopology(graph).linkCount).to.eql(0);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
    });
    it("finds 1 collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodeCount).to.eql(1);
    });
    it("finds no independent graphs", () => {
      chai.expect(getTopology(graph).independentGraphCount).to.eql(0);
    });
    it("finds 2 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(2);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphCount).to.eql(0);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphCount).to.eql(0);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphCount).to.eql(0);
    });
  });

  describe("analyzes a model with a 2 connected nodes, 1 is a collector", () => {
    const graph: ISageGraph = simpleTwoNodeGraph;
    it("finds 2 nodes", () => {
      chai.expect(getTopology(graph).nodeCount).to.eql(2);
    });
    it("finds 1 link", () => {
      chai.expect(getTopology(graph).linkCount).to.eql(1);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
    });
    it("finds 1 collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodeCount).to.eql(1);
    });
    it("finds 1 independent graph", () => {
      chai.expect(getTopology(graph).independentGraphCount).to.eql(1);
    });
    it("finds no unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(0);
    });
    it("finds 1 linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphCount).to.eql(1);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphCount).to.eql(0);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphCount).to.eql(0);
    });
  });

  describe("analyzes a model with a 2 linear graphs and 1 ring graph", () => {
    const graph: ISageGraph = simpleLinearExamples;
    it("finds 8 nodes", () => {
      chai.expect(getTopology(graph).nodeCount).to.eql(8);
    });
    it("finds 5 links", () => {
      chai.expect(getTopology(graph).linkCount).to.eql(5);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
    });
    it("finds 2 collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodeCount).to.eql(2);
    });
    it("finds 3 independent graphs", () => {
      chai.expect(getTopology(graph).independentGraphCount).to.eql(3);
    });
    it("finds 1 unconnected node", () => {
      chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(1);
    });
    it("finds 2 linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphCount).to.eql(2);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphCount).to.eql(0);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphCount).to.eql(0);
    });
  });

  describe("analyzes a linear, 3 node, 2 transfer link graph", () => {
    const graph: ISageGraph = threeNodesWithTransferLinks;
    it("finds 5 nodes", () => {
      chai.expect(getTopology(graph).nodeCount).to.eql(5);
    });
    it("finds 4 links", () => {
      chai.expect(getTopology(graph).linkCount).to.eql(4);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
    });
    it("finds 3 collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodeCount).to.eql(3);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).independentGraphCount).to.eql(1);
    });
    it("finds 0 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(0);
    });
    it("finds 1 linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphCount).to.eql(1);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphCount).to.eql(0);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphCount).to.eql(0);
    });
  });

  describe("analyzes a branching and a joining graph", () => {
    const graph: ISageGraph = branchAndJoinExamples;
    it("finds 6 nodes", () => {
      chai.expect(getTopology(graph).nodeCount).to.eql(6);
    });
    it("finds 4 links", () => {
      chai.expect(getTopology(graph).linkCount).to.eql(4);
    });
    it("finds 1 node with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(1);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodeCount).to.eql(0);
    });
    it("finds 2 independent graphs", () => {
      chai.expect(getTopology(graph).independentGraphCount).to.eql(2);
    });
    it("finds 0 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphCount).to.eql(0);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphCount).to.eql(0);
    });
    it("finds 2 graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphCount).to.eql(2);
    });
  });


  // OLD STUFF STARTS HERE

  describe("Topology detection", () => {

    describe("can count nodes with multiple incoming links", () => {
      it("finds no multiLinkTargetNodes in an empty graph", () => {
        const nodes: ISageNode[] = [];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
      });
      it("finds 1 multiLinkTargetNode in a 3 node combining branch", () => {
        const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }, { key: "c" }];
        const links: ISageLink[] = [
          { title: "L1", sourceNode: "a", targetNode: "b" },
          { title: "L2", sourceNode: "c", targetNode: "b" }
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(1);
      });
      it("finds no multiLinkTargetNodes in a 3 node diverging branch", () => {
        const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }, { key: "c" }];
        const links: ISageLink[] = [
          { title: "L1", sourceNode: "a", targetNode: "b" },
          { title: "L2", sourceNode: "a", targetNode: "c" }
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
      });
      it("finds no multiLinkTargetNodes in a 3 node linear graph", () => {
        const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }, { key: "c" }];
        const links: ISageLink[] = [
          { title: "L1", sourceNode: "a", targetNode: "b" },
          { title: "L2", sourceNode: "b", targetNode: "c" }
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
      });

    });

    describe("counts unconnected nodes", () => {
      it("finds no unconnected nodes in an empty model", () => {
        const nodes: ISageNode[] = [];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(0);
      });
      it("finds 1 unconnected nodes in model with 1 node", () => {
        const nodes: ISageNode[] = [{ key: "a" }];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(1);
      });
      it("finds 2 unconnected nodes in model with 2 unlinked nodes", () => {
        const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(2);
      });
      it("finds 0 unconnected nodes in model with 2 linked nodes", () => {
        const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }];
        const links: ISageLink[] = [{ title: "", sourceNode: "a", targetNode: "b" }];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(0);
      });
    });

    describe("finding cycles", () => {
      it("finds cycles when they exist", () => {
        const links: ISageLink[] = [
          { title: "l1", sourceNode: "a", targetNode: "b" },
          { title: "l2", sourceNode: "b", targetNode: "a" },
        ];
        const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).cycleCount).to.eql(1);
      });

      it("wont find cycles when they dont exist", () => {
        const links: ISageLink[] = [
          { title: "l1", sourceNode: "a", targetNode: "b" }
        ];
        const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).cycleCount).to.eql(0);
      });
    });

    describe("counts independent graphs", () => {
      it("doesn't find any when none are present", () => {
        const nodes: ISageNode[] = [];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).independentGraphCount).to.eql(0);
      });
      // // it("finds one when there is a single node", () => {
      // //   const nodes: ISageNode[] = [{ key: "a" }];
      // //   const links: ISageLink[] = [];
      // //   const graph: ISageGraph = { nodes, links };
      // //   chai.expect(getTopology(graph).independentGraphCount).to.eql(1);
      // // });
      // it("finds two when there are two un-connected nodes", () => {
      //   const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }];
      //   const links: ISageLink[] = [];
      //   const graph: ISageGraph = { nodes, links };
      //   chai.expect(getTopology(graph).independentGraphCount).to.eql(2);
      // });
      it("finds one when there are two connected nodes", () => {
        const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }];
        const links: ISageLink[] = [{ title: "", sourceNode: "a", targetNode: "b" }];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).independentGraphCount).to.eql(1);
      });
      it("finds two when there are two, multi-node, unconnected sub-graphs", () => {
        const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }];
        const links: ISageLink[] = [
          { title: "L1", sourceNode: "a", targetNode: "b" },
          { title: "L2", sourceNode: "c", targetNode: "d" }
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).independentGraphCount).to.eql(2);
      });
    });

    // describe("determines if a model is linear", () => {
    //   it("a model without any nodes is NOT linear", () => {
    //     const nodes: ISageNode[] = [];
    //     const links: ISageLink[] = [];
    //     const graph: ISageGraph = { nodes, links };
    //     chai.expect(getTopology(graph).isLinear).to.eql(false);
    //   });
    //   it("a model with single node is linear (a degenerate case)", () => {
    //     const nodes: ISageNode[] = [{ key: "a" }];
    //     const links: ISageLink[] = [];
    //     const graph: ISageGraph = { nodes, links };
    //     chai.expect(getTopology(graph).isLinear).to.eql(true);
    //   });
    //   it("a model with any unconnected nodes is NOT linear", () => {
    //     const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }];
    //     const links: ISageLink[] = [];
    //     const graph: ISageGraph = { nodes, links };
    //     chai.expect(getTopology(graph).isLinear).to.eql(false);
    //   });
    //   it("a model with simply connected nodes is linear", () => {
    //     const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }, { key: "c" }];
    //     const links: ISageLink[] = [
    //       { title: "L1", sourceNode: "a", targetNode: "b" },
    //       { title: "L2", sourceNode: "b", targetNode: "c" }
    //     ];
    //     const graph: ISageGraph = { nodes, links };
    //     chai.expect(getTopology(graph).isLinear).to.eql(true);
    //   });
    //   it("a model with a cycle is NOT linear", () => {
    //     const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }, { key: "c" }];
    //     const links: ISageLink[] = [
    //       { title: "L1", sourceNode: "a", targetNode: "b" },
    //       { title: "L2", sourceNode: "b", targetNode: "c" },
    //       { title: "L2", sourceNode: "c", targetNode: "a" },
    //     ];
    //     const graph: ISageGraph = { nodes, links };
    //     chai.expect(getTopology(graph).isLinear).to.eql(false);
    //   });
    //   it("a simply connected model, with a branch, is NOT linear", () => {
    //     const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }, { key: "c" }];
    //     const links: ISageLink[] = [
    //       { title: "L1", sourceNode: "a", targetNode: "b" },
    //       { title: "L2", sourceNode: "b", targetNode: "c" },
    //       { title: "L2", sourceNode: "a", targetNode: "c" },
    //     ];
    //     const graph: ISageGraph = { nodes, links };
    //     chai.expect(getTopology(graph).isLinear).to.eql(false);
    //   });
    // });

    describe("determines if a model is branched", () => {
      it("a model without any nodes is NOT branched", () => {
        const nodes: ISageNode[] = [];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isBranched).to.eql(false);
      });
      it("a model with single node is NOT branched", () => {
        const nodes: ISageNode[] = [{ key: "a" }];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isBranched).to.eql(false);
      });
      it("detects a branch from one node to two", () => {
        const nodes: ISageNode[] = [
          { key: "a" },
          { key: "b" },
          { key: "c" }
        ];
        const links: ISageLink[] = [
          { title: "L1", sourceNode: "a", targetNode: "b" },
          { title: "L2", sourceNode: "a", targetNode: "c" }
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isBranched).to.eql(true);
      });
      it("detects a join from two nodes to one", () => {
        const nodes: ISageNode[] = [
          { key: "a" },
          { key: "b" },
          { key: "c" }
        ];
        const links: ISageLink[] = [
          { title: "L1", sourceNode: "a", targetNode: "c" },
          { title: "L2", sourceNode: "b", targetNode: "c" }
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isBranched).to.eql(true);
      });
      it("a linear model is NOT branched", () => {
        const nodes: ISageNode[] = [{ key: "a" }, { key: "b" }, { key: "c" }];
        const links: ISageLink[] = [
          { title: "L1", sourceNode: "a", targetNode: "b" },
          { title: "L2", sourceNode: "b", targetNode: "c" }
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isBranched).to.eql(false);
      });
    });

    describe("counts the number of collector nodes", () => {
      it("finds no collector nodes in an empty model", () => {
        const nodes: ISageNode[] = [];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).collectorNodeCount).to.eql(0);
      });
      it("finds 1 collector node in a model with 1 node that's an accumulator", () => {
        const nodes: ISageNode[] = [{ key: "a", data: { title: "", isAccumulator: true } }];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).collectorNodeCount).to.eql(1);
      });
      it("finds no collector nodes in a model with 1 node that is not an accumulator", () => {
        const nodes: ISageNode[] = [{ key: "a", data: { title: "", isAccumulator: false } }];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).collectorNodeCount).to.eql(0);
      });
      it("finds 2 collector nodes in a linear model with 4 nodes, where 2 are accumulators", () => {
        const nodes: ISageNode[] = [
          { key: "a", data: { title: "", isAccumulator: false } },
          { key: "b", data: { title: "", isAccumulator: true } },
          { key: "c", data: { title: "", isAccumulator: false } },
          { key: "d", data: { title: "", isAccumulator: true } }
        ];
        const links: ISageLink[] = [
          { title: "", sourceNode: "a", targetNode: "b" },
          { title: "", sourceNode: "b", targetNode: "c" },
          { title: "", sourceNode: "c", targetNode: "d" }
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).collectorNodeCount).to.eql(2);
      });
    });

  });

});
