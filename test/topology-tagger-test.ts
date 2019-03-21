
// see Mocha Chai assertions: https://www.chaijs.com/api/bdd/
import { describe, afterEach, it } from "mocha";
import * as chai from "chai";
chai.config.includeStack = true;
import { v1220data as sageData} from "./serialized-test-data/v-1.22.0";
import { Graph } from "graphlib";
import {
  convertSageModelToGraph,
  countNodes,
  getCycles,
  ILinkStruct,
  INodeStruct,
  ISageGraphStruct
} from "../src/code/utils/topology-tagger";

describe("A TopologyTagger", () => {
  beforeEach(() => null);
  afterEach(() => null);

  it("Tests are running", () => {
    chai.expect(1).to.eql(1);
  });

  it("can convert a Sage model to a graphlib graph", () => {
    const g = convertSageModelToGraph(sageData);
    chai.expect(g).respondTo("nodeCount");
  });

  it("can count the number of nodes", () => {
    const g = convertSageModelToGraph(sageData);
    g.nodeCount().should.eql(9);
  });

  it("can count the number of links", () => {
    const g = convertSageModelToGraph(sageData);
    g.edgeCount().should.eql(4);
  });

  describe("Topology detection", () => {
    describe("finding cycles", () => {
      it("finds cycles when they exist", () => {
        const links: ILinkStruct[] = [
          {title: "l1", sourceNode: "a", targetNode: "b"},
          {title: "l2", sourceNode: "b", targetNode: "a"},
        ];
        const nodes: INodeStruct[] = [
          {data: {title: "a"}, key: "a"},
          {data: {title: "b"}, key: "b"}
        ];
        const graph: ISageGraphStruct = {nodes, links};
        const g = convertSageModelToGraph(graph);
        chai.expect(getCycles(g).length).to.eql(1);
      });

      it("wont find cycles when they dont exist", () => {
        const links: ILinkStruct[] = [
          {title: "l1", sourceNode: "a", targetNode: "b"}
        ];
        const nodes: INodeStruct[] = [
          {data: {title: "a"}, key: "a"},
          {data: {title: "b"}, key: "b"}
        ];
        const graph: ISageGraphStruct = {nodes, links};
        const g = convertSageModelToGraph(graph);
        chai.expect(getCycles(g).length).to.eql(0);
      });
    });
  });

});


