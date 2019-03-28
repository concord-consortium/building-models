
// see Mocha Chai assertions: https://www.chaijs.com/api/bdd/
import { describe, afterEach, it } from "mocha";
import * as chai from "chai";
chai.config.includeStack = true;
import { v1220data as sageData} from "./serialized-test-data/v-1.22.0";
import {
  getAnalysisGraph,
  ISageLink,
  ISageNode,
  ISageGraph,
  getTopology
} from "../src/code/utils/topology-tagger";

describe("A TopologyTagger", () => {
  beforeEach(() => null);
  afterEach(() => null);

  it("can convert a Sage model to a graphlib graph", () => {
    const g = getAnalysisGraph(sageData);
    chai.expect(g).respondTo("nodeCount");
  });

  it("can count the number of nodes", () => {
    chai.expect(getTopology(sageData).nodeCount).to.eql(9);
  });

  it("can count the number of links", () => {
    chai.expect(getTopology(sageData).linkCount).to.eql(4);
  });

  describe("Topology detection", () => {

    describe("can count nodes with multiple incoming links", () => {
      it("finds no multiLinkTargetNodes in an empty graph", () => {
        const nodes: ISageNode[] = [];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
      });
      it("finds 1 multiLinkTargetNode in a 3 node combining branch", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}, {key: "c"} ];
        const links: ISageLink[] = [
          {title: "L1", sourceNode: "a", targetNode: "b"},
          {title: "L2", sourceNode: "c", targetNode: "b"}
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(1);
      });
      it("finds no multiLinkTargetNodes in a 3 node diverging branch", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}, {key: "c"} ];
        const links: ISageLink[] = [
          {title: "L1", sourceNode: "a", targetNode: "b"},
          {title: "L2", sourceNode: "a", targetNode: "c"}
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
      });
      it("finds no multiLinkTargetNodes in a 3 node linear graph", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}, {key: "c"} ];
        const links: ISageLink[] = [
          {title: "L1", sourceNode: "a", targetNode: "b"},
          {title: "L2", sourceNode: "b", targetNode: "c"}
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).multiLinkTargetNodeCount).to.eql(0);
      });

    });

    describe("counts unconnected nodes", () => {
      it("finds no unconnected nodes in an empty model", () => {
        const nodes: ISageNode[] = [];
        const links: ISageLink[] = [];
        const graph: ISageGraph = {nodes, links};
        chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(0);
      });
      it("finds 1 unconnected nodes in model with 1 node", () => {
        const nodes: ISageNode[] = [ {key: "a"}];
        const links: ISageLink[] = [];
        const graph: ISageGraph = {nodes, links};
        chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(1);
      });
      it("finds 2 unconnected nodes in model with 2 unlinked nodes", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}];
        const links: ISageLink[] = [];
        const graph: ISageGraph = {nodes, links};
        chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(2);
      });
      it("finds 0 unconnected nodes in model with 2 linked nodes", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}];
        const links: ISageLink[] = [ {title: "", sourceNode: "a", targetNode: "b"}];
        const graph: ISageGraph = {nodes, links};
        chai.expect(getTopology(graph).unconnectedNodeCount).to.eql(0);
      });
    });

    describe("finding cycles", () => {
      it("finds cycles when they exist", () => {
        const links: ISageLink[] = [
          {title: "l1", sourceNode: "a", targetNode: "b"},
          {title: "l2", sourceNode: "b", targetNode: "a"},
        ];
        const nodes: ISageNode[] = [{key: "a"}, {key: "b"}];
        const graph: ISageGraph = {nodes, links};
        chai.expect(getTopology(graph).cycleCount).to.eql(1);
      });

      it("wont find cycles when they dont exist", () => {
        const links: ISageLink[] = [
          {title: "l1", sourceNode: "a", targetNode: "b"}
        ];
        const nodes: ISageNode[] = [{key: "a"}, {key: "b"}];
        const graph: ISageGraph = {nodes, links};
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
      it("finds one when there is a single node", () => {
        const nodes: ISageNode[] = [ {key: "a"}];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).independentGraphCount).to.eql(1);
      });
      it("finds two when there are two un-connected nodes", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).independentGraphCount).to.eql(2);
      });
      it("finds one when there are two connected nodes", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}];
        const links: ISageLink[] = [ {title: "", sourceNode: "a", targetNode: "b"}];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).independentGraphCount).to.eql(1);
      });
      it("finds two when there are two, multi-node, unconnected sub-graphs", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}, {key: "c"}, {key: "d"}];
        const links: ISageLink[] = [
          {title: "L1", sourceNode: "a", targetNode: "b"},
          {title: "L2", sourceNode: "c", targetNode: "d"}
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).independentGraphCount).to.eql(2);
      });
    });

    describe("determines if a model is linear", () => {
      it("a model without any nodes is NOT linear", () => {
        const nodes: ISageNode[] = [];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isLinear).to.eql(false);
      });
      it("a model with single node is linear (a degenerate case)", () => {
        const nodes: ISageNode[] = [ {key: "a"} ];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isLinear).to.eql(true);
      });
      it("a model with any unconnected nodes is NOT linear", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"} ];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isLinear).to.eql(false);
      });
      it("a model with simply connected nodes is linear", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}, {key: "c"} ];
        const links: ISageLink[] = [
          {title: "L1", sourceNode: "a", targetNode: "b"},
          {title: "L2", sourceNode: "b", targetNode: "c"}
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isLinear).to.eql(true);
      });
      it("a model with a cycle is NOT linear", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}, {key: "c"} ];
        const links: ISageLink[] = [
          {title: "L1", sourceNode: "a", targetNode: "b"},
          {title: "L2", sourceNode: "b", targetNode: "c"},
          {title: "L2", sourceNode: "c", targetNode: "a"},
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isLinear).to.eql(false);
      });
      it("a simply connected model, with a branch, is NOT linear", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}, {key: "c"} ];
        const links: ISageLink[] = [
          {title: "L1", sourceNode: "a", targetNode: "b"},
          {title: "L2", sourceNode: "b", targetNode: "c"},
          {title: "L2", sourceNode: "a", targetNode: "c"},
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isLinear).to.eql(false);
      });
    });

    describe("determines if a model is branched", () => {
      it("a model without any nodes is NOT branched", () => {
        const nodes: ISageNode[] = [];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isBranched).to.eql(false);
      });
      it("a model with single node is NOT branched", () => {
        const nodes: ISageNode[] = [ {key: "a"} ];
        const links: ISageLink[] = [];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isBranched).to.eql(false);
      });
      it("detects a branch from one node to two", () => {
        const nodes: ISageNode[] = [
          {key: "a"},
          {key: "b"},
          {key: "c"}
        ];
        const links: ISageLink[] = [
          {title: "L1", sourceNode: "a", targetNode: "b"},
          {title: "L2", sourceNode: "a", targetNode: "c"}
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isBranched).to.eql(true);
      });
      it("detects a join from two nodes to one", () => {
        const nodes: ISageNode[] = [
          {key: "a"},
          {key: "b"},
          {key: "c"}
        ];
        const links: ISageLink[] = [
          {title: "L1", sourceNode: "a", targetNode: "c"},
          {title: "L2", sourceNode: "b", targetNode: "c"}
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isBranched).to.eql(true);
      });
      it("a linear model is NOT branched", () => {
        const nodes: ISageNode[] = [ {key: "a"}, {key: "b"}, {key: "c"} ];
        const links: ISageLink[] = [
          {title: "L1", sourceNode: "a", targetNode: "b"},
          {title: "L2", sourceNode: "b", targetNode: "c"}
        ];
        const graph: ISageGraph = { nodes, links };
        chai.expect(getTopology(graph).isBranched).to.eql(false);
      });
    });



    describe("counts the number of collector nodes", () => {
      it("finds no collector nodes in an empty model", () => {
        const nodes: ISageNode[] = [];
        const links: ISageLink[] = [];
        const graph: ISageGraph = {nodes, links};
        chai.expect(getTopology(graph).collectorNodeCount).to.eql(0);
      });
      it("finds 1 collector node in a model with 1 node that's an accumulator", () => {
        const nodes: ISageNode[] = [ {key: "a", data: { title: "", isAccumulator: true }}];
        const links: ISageLink[] = [];
        const graph: ISageGraph = {nodes, links};
        chai.expect(getTopology(graph).collectorNodeCount).to.eql(1);
      });
      it("finds no collector nodes in a model with 1 node that is not an accumulator", () => {
        const nodes: ISageNode[] = [ {key: "a", data: { title: "", isAccumulator: false }}];
        const links: ISageLink[] = [];
        const graph: ISageGraph = {nodes, links};
        chai.expect(getTopology(graph).collectorNodeCount).to.eql(0);
      });
      it("finds 2 collector nodes in a linear model with 4 nodes, where 2 are accumulators", () => {
        const nodes: ISageNode[] = [
          {key: "a", data: { title: "", isAccumulator: false }},
          {key: "b", data: { title: "", isAccumulator: true }},
          {key: "c", data: { title: "", isAccumulator: false }},
          {key: "d", data: { title: "", isAccumulator: true }}
        ];
        const links: ISageLink[] = [
          {title:"", sourceNode: "a", targetNode: "b"},
          {title:"", sourceNode: "b", targetNode: "c"},
          {title:"", sourceNode: "c", targetNode: "d"}
        ];
        const graph: ISageGraph = {nodes, links};
        chai.expect(getTopology(graph).collectorNodeCount).to.eql(2);
      });
    });

  });

});
