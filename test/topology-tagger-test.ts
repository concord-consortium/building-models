
// see Mocha Chai assertions: https://www.chaijs.com/api/bdd/
import { describe, afterEach, it } from "mocha";
import * as chai from "chai";
chai.config.includeStack = true;
import { v1220data as sageData} from "./serialized-test-data/v-1.22.0";
import { Graph } from "graphlib";
import {
  getAnalysisGraph,
  countNodes,
  getCycles,
  ISageLink,
  ISageNode,
  ISageGraph,
  getToplogy
} from "../src/code/utils/topology-tagger";

describe("A TopologyTagger", () => {
  beforeEach(() => null);
  afterEach(() => null);

  it("can convert a Sage model to a graphlib graph", () => {
    const g = getAnalysisGraph(sageData);
    chai.expect(g).respondTo("nodeCount");
  });

  it("can count the number of nodes", () => {
    chai.expect(getToplogy(sageData).nodeCount).to.eql(9);
  });

  it("can count the number of links", () => {
    chai.expect(getToplogy(sageData).linkCount).to.eql(4);
  });

  describe("Topology detection", () => {
    describe("finding cycles", () => {
      it("finds cycles when they exist", () => {
        const links: ISageLink[] = [
          {title: "l1", sourceNode: "a", targetNode: "b"},
          {title: "l2", sourceNode: "b", targetNode: "a"},
        ];
        const nodes: ISageNode[] = [{key: "a"}, {key: "b"}];
        const graph: ISageGraph = {nodes, links};
        chai.expect(getToplogy(graph).cycles).to.eql(1);
      });

      it("wont find cycles when they dont exist", () => {
        const links: ISageLink[] = [
          {title: "l1", sourceNode: "a", targetNode: "b"}
        ];
        const nodes: ISageNode[] = [{key: "a"}, {key: "b"}];
        const graph: ISageGraph = {nodes, links};
        chai.expect(getToplogy(graph).cycles).to.eql(0);
      });
    });
  });

});


