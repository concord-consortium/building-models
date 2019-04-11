const _ = require("lodash");
import { Graph as AnalysisGraph, alg as GraphLibAlg} from "graphlib";

type sageNodeKey = string;

export interface ISageLink {
  sourceNode: sageNodeKey;
  targetNode: sageNodeKey;
  title: string;
}

export interface ISageData {
  title: string;
  isAccumulator: boolean;
}

export interface ISageNode {
  key: sageNodeKey;
  data?: ISageData;
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
    graphlibGraph.setNode(n.key, { isAccumulator: n.data && n.data.isAccumulator });
  });
  sageModelGraph.links.forEach((l) => {
    graphlibGraph.setEdge(l.sourceNode, l.targetNode, l.title);
  });
  return graphlibGraph;
}

function countMultiLinkTargetNodes(g) {
  return g.nodes()
          .map( (node) => (g.inEdges(node).length > 1) ? 1 : 0 )
          .reduce( (a, b) => (a + b), 0 );
}

function countUnconnectedNodes(g) {
  return g.nodes()
          .map( (node) => (g.nodeEdges(node).length <= 0 ? 1 : 0))
          .reduce( (a, b) => (a + b), 0 );
}

function countAccumulatorNodes(g) {
  return g.nodes()
          .map( (node) => (g.node(node).isAccumulator ? 1 : 0))
          .reduce( (a, b) => (a + b), 0 );
}

function isLinearModel(g) {
  // A model is only linear if there is a single, non-cyclic component (meaning
  // all nodes in the model are connected), and that all nodes have, at most 1
  // inEdge and 1 outEdge. Notice that a model with no nodes is not considered
  // linear; however, a single node **is** linear -- although this is a
  // degenerate case.
  if (GraphLibAlg.findCycles(g).length > 0) {
    return false;   // If there are any cycles; non-linear.
  }
  const components = GraphLibAlg.components(g);
  if (components.length !== 1) {
    return false;   // If any nodes are not connected, non-linear.
  }
  const atMost1InOutEdges = (node) => {
    return g.inEdges(node).length <= 1 && g.outEdges(node).length <= 1;
  };
  return components[0].map( node => (atMost1InOutEdges(node)) ? 1 : 0)
    .reduce ( (a, b) => (a + b), 0) === g.nodeCount();
}

export function getTopology(sageModelGraph: ISageGraph) {
  const g = getAnalysisGraph(sageModelGraph);

  const nodeCount = g.nodeCount();
  const linkCount = g.edgeCount();
  const multiLinkTargetNodeCount = countMultiLinkTargetNodes(g);
  const collectorNodeCount = countAccumulatorNodes(g);
  const independentGraphCount = GraphLibAlg.components(g).length;
  const unconnectedNodeCount = countUnconnectedNodes(g);
  const cycleCount = GraphLibAlg.findCycles(g).length;
  const isLinear = isLinearModel(g);

  return {
    nodeCount,
    linkCount,
    multiLinkTargetNodeCount,
    collectorNodeCount,
    independentGraphCount,
    unconnectedNodeCount,
    cycleCount,
    isLinear
  };
}
