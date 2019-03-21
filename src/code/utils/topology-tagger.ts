const _ = require("lodash");
import { Graph as AnalysisGraph, alg as GraphLibAlg} from "graphlib";
import { Link } from "../models/link";
import { Node } from "../models/node";

type sageNodeKey = string;

export interface ISageLink {
  sourceNode: sageNodeKey;
  targetNode: sageNodeKey;
  title: string;
}

export interface ISageNode {
  key: sageNodeKey;
}

export interface ITopology {
  nodeCount: number;
  linkCount: number;
  cycles: number;
}
export interface ISageGraph {
  links: ISageLink[];
  nodes: ISageNode[];
}

export function getAnalysisGraph(sageModelGraph: ISageGraph) {
  const graphlibGraph = new AnalysisGraph();
  sageModelGraph.nodes.forEach((n) => {
    graphlibGraph.setNode(n.key);
  });
  sageModelGraph.links.forEach((l) => {
    graphlibGraph.setEdge(l.sourceNode, l.targetNode, l.title);
  });
  return graphlibGraph;
}

export function countNodes(g: AnalysisGraph) {
  return g.nodeCount();
}

export function getCycles(g: AnalysisGraph) {
  return GraphLibAlg.findCycles(g);
}


export function getToplogy(sageModelGraph: ISageGraph) {
  const g = getAnalysisGraph(sageModelGraph);
  const nodeCount = g.nodeCount();
  const linkCount = g.edgeCount();
  const cycles = GraphLibAlg.findCycles(g);
  return { nodeCount, linkCount, cycles: cycles.length };
}
