
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
import { simpleFeedbackExamples } from "./serialized-test-data/topology-test-cases/simple-feedback-examples";
import { feedbackWithTwoCycles } from "./serialized-test-data/topology-test-cases/feedback-with-two-cycles";
import { linkToTransferNode } from "./serialized-test-data/topology-test-cases/link-to-transfer-node";
import { manyMultiPaths } from "./serialized-test-data/topology-test-cases/many-multi-paths";
import { nodeToTransferNode } from "./serialized-test-data/topology-test-cases/node-to-transfer-node";
import { nonLinearFourNodes } from "./serialized-test-data/topology-test-cases/non-linear-four-nodes";
import { immediateFeedback } from "./serialized-test-data/topology-test-cases/immediate-feedback";
import { leadingRingFeedback } from "./serialized-test-data/topology-test-cases/leading-ring-feedback";
import { embeddedRingFeedback } from "./serialized-test-data/topology-test-cases/embedded-ring-feedback";
import { immediateFeedbackOut } from "./serialized-test-data/topology-test-cases/immedate-feedback-from";
import { multipathAndFeedback } from "./serialized-test-data/topology-test-cases/multipath-and-feedback";

describe("TopologyTagger", () => {
  beforeEach(() => null);
  afterEach(() => null);

  describe("converts a V22 Sage model to a graphlib graph", () => {
    it("acts like a graphlib graph", () => {
      const g = getAnalysisGraph(sageData);
      chai.expect(g).respondTo("nodeCount");
    });
    it("counts the number of nodes", () => {
      chai.expect(getTopology(sageData).nodes).to.eql(9);
    });
    it("counts the number of links", () => {
      chai.expect(getTopology(sageData).links).to.eql(8);
    });
  });

  describe("analyzes an empty model", () => {
    const nodes: ISageNode[] = [];
    const links: ISageLink[] = [];
    const graph: ISageGraph = { nodes, links };
    it("finds no nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(0);
    });
    it("finds no links", () => {
      chai.expect(getTopology(graph).links).to.eql(0);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(0);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds no independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(0);
    });
    it("finds no unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(0);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(0);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("analyzes a model with a single node", () => {
    const nodes: ISageNode[] = [{ key: "singletonNode" }];
    const links: ISageLink[] = [];
    const graph: ISageGraph = { nodes, links };
    it("finds 1 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(1);
    });
    it("finds no links", () => {
      chai.expect(getTopology(graph).links).to.eql(0);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(0);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds no independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(0);
    });
    it("finds 1 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(1);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(0);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(0);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("analyzes a model with a 2 unconnected nodes, 1 is a collector", () => {
    const graph: ISageGraph = twoUnconnectedNodes;
    it("finds 2 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(2);
    });
    it("finds no links", () => {
      chai.expect(getTopology(graph).links).to.eql(0);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(0);
    });
    it("finds 1 collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(1);
    });
    it("finds no independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(0);
    });
    it("finds 2 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(2);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(0);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(0);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("analyzes a model with a 2 connected nodes, 1 is a collector", () => {
    const graph: ISageGraph = simpleTwoNodeGraph;
    it("finds 2 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(2);
    });
    it("finds 1 link", () => {
      chai.expect(getTopology(graph).links).to.eql(1);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(0);
    });
    it("finds 1 collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(1);
    });
    it("finds 1 independent graph", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds no unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds 1 linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(1);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(0);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(0);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("analyzes a model with a 2 linear graphs and 1 ring graph", () => {
    const graph: ISageGraph = simpleLinearExamples;
    it("finds 8 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(8);
    });
    it("finds 5 links", () => {
      chai.expect(getTopology(graph).links).to.eql(5);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(0);
    });
    it("finds 2 collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(2);
    });
    it("finds 3 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(3);
    });
    it("finds 1 unconnected node", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(1);
    });
    it("finds 2 linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(2);
    });
    it("finds 1 graph with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(1);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(0);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("analyzes a model with ring feedback between to outer links", () => {
    const graph: ISageGraph = embeddedRingFeedback;
    it("finds 5 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(5);
    });
    it("finds 5 links", () => {
      chai.expect(getTopology(graph).links).to.eql(5);
    });
    it("finds 1 node with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(1);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds no unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds 1 graph with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(1);
    });
    it("finds 1 graph with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(1);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("analyzes a model with a link to 3 nodes with ring feedback", () => {
    const graph: ISageGraph = leadingRingFeedback;
    it("finds 4 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(4);
    });
    it("finds 4 links", () => {
      chai.expect(getTopology(graph).links).to.eql(4);
    });
    it("finds 1 node with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(1);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds no unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds 1 graph with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(1);
    });
    it("finds 1 graph with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(1);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("analyzes an immediate feedback graph with a link \"to\" it", () => {
    const graph: ISageGraph = immediateFeedback;
    it("finds 3 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(3);
    });
    it("finds 3 links", () => {
      chai.expect(getTopology(graph).links).to.eql(3);
    });
    it("finds 1 node with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(1);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds no unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds 1 graph with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(1);
    });
    it("finds 1 graph with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(1);
    });
    it("inds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("analyzes an immediate feedback graph with at link \"from\" ", () => {
    const graph: ISageGraph = immediateFeedbackOut;
    it("finds 3 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(3);
    });
    it("finds 3 links", () => {
      chai.expect(getTopology(graph).links).to.eql(3);
    });
    it("finds 0 node with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(0);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds no unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds 1 graph with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(1);
    });
    it("finds 1 graph with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(1);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });


  describe("analyzes a linear, 3 node, 2 transfer link graph", () => {
    const graph: ISageGraph = threeNodesWithTransferLinks;
    it("finds 5 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(5);
    });
    it("finds 4 links", () => {
      chai.expect(getTopology(graph).links).to.eql(4);
    });
    it("finds no nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(0);
    });
    it("finds 3 collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(3);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds 0 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds 1 linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(1);
    });
    it("finds no graph with feedback", () => {
      // Old way should result in 1
      // New Way should result in zero.
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(0);
    });
    it("finds no graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(0);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("analyzes a branching and a joining graph", () => {
    const graph: ISageGraph = branchAndJoinExamples;
    it("finds 6 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(6);
    });
    it("finds 4 links", () => {
      chai.expect(getTopology(graph).links).to.eql(4);
    });
    it("finds 1 node with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(1);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds 2 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(2);
    });
    it("finds 0 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(0);
    });
    it("finds 2 graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(2);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("analyzes some simple feedback graphs", () => {
    const graph: ISageGraph = simpleFeedbackExamples;
    it("finds 13 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(13);
    });
    it("finds 12 links", () => {
      chai.expect(getTopology(graph).links).to.eql(12);
    });
    it("finds 1 node with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(1);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds 4 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(4);
    });
    it("finds 0 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds 3 graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(3);
    });
    it("finds 2 graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(2);
    });
    it("finds no graphs with a multi-paths", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("counts 1 feedback graph even if contains 2 or more cycles", () => {
    const graph: ISageGraph = feedbackWithTwoCycles;
    it("finds 6 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(6);
    });
    it("finds 7 links", () => {
      chai.expect(getTopology(graph).links).to.eql(7);
    });
    it("finds 1 node with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(1);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds 0 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds 1 graph with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(1);
    });
    it("finds 1 graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(1);
    });
    it("finds no graphs with a multi-paths", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("treats transfer nodes as part of the graph", () => {
    const graph: ISageGraph = linkToTransferNode;
    it("finds 3 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(3);
    });
    it("finds 3 links", () => {
      chai.expect(getTopology(graph).links).to.eql(3);
    });
    it("finds 1 node with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(1);
    });
    it("finds 2 collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(2);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds 0 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds 1 graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(1);
    });
    it("finds 1 graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(1);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("treats transfer nodes as part of the graph, part 2", () => {
    const graph: ISageGraph = nodeToTransferNode;
    it("finds 4 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(4);
    });
    it("finds 3 links", () => {
      chai.expect(getTopology(graph).links).to.eql(3);
    });
    it("finds 1 node with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(1);
    });
    it("finds 2 collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(2);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds 0 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds no graphs with feedback", () => {
      // Old way should return 1
      // New way should return 0
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(0);
    });
    it("finds 1 graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(1);
    });
    it("finds no graphs with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(0);
    });
  });

  describe("understands multiple, multi-paths in a 4 node graph", () => {
    const graph: ISageGraph = nonLinearFourNodes;
    it("finds 4 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(4);
    });
    it("finds 6 links", () => {
      chai.expect(getTopology(graph).links).to.eql(6);
    });
    it("finds 2 nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(2);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds 0 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(0);
    });
    it("finds 1 graphs with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(1);
    });
    it("finds 1 graph with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(1);
    });
  });

  describe("finds a multi-path graph in a complex multi-path example", () => {
    const graph: ISageGraph = manyMultiPaths;
    it("finds 4 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(4);
    });
    it("finds 6 links", () => {
      chai.expect(getTopology(graph).links).to.eql(6);
    });
    it("finds 2 nodes with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(2);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds 0 unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds no graphs with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(0);
    });
    it("finds 1 graph with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(1);
    });
    it("finds 1 graph with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(1);
    });
  });

  describe("finds a multi-path and feedback in the same graph", () => {
    const graph: ISageGraph = multipathAndFeedback;
    it("finds 4 nodes", () => {
      chai.expect(getTopology(graph).nodes).to.eql(5);
    });
    it("finds 6 links", () => {
      chai.expect(getTopology(graph).links).to.eql(6);
    });
    it("finds 1 node with multiple target links", () => {
      chai.expect(getTopology(graph).multiLinkTargetNodes).to.eql(1);
    });
    it("finds no collector nodes", () => {
      chai.expect(getTopology(graph).collectorNodes).to.eql(0);
    });
    it("finds 1 independent graphs", () => {
      chai.expect(getTopology(graph).graphs).to.eql(1);
    });
    it("finds no unconnected nodes", () => {
      chai.expect(getTopology(graph).unconnectedNodes).to.eql(0);
    });
    it("finds no linear graphs", () => {
      chai.expect(getTopology(graph).linearGraphs).to.eql(0);
    });
    it("finds 1 graph with feedback", () => {
      chai.expect(getTopology(graph).feedbackGraphs).to.eql(1);
    });
    it("finds 1 graph with branches", () => {
      chai.expect(getTopology(graph).branchedGraphs).to.eql(1);
    });
    it("finds 1 graph with a multi-path", () => {
      chai.expect(getTopology(graph).multiPathGraphs).to.eql(1);
    });
  });

});
