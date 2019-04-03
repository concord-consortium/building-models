const _ = require("lodash");
import { Graph as AnalysisGraph, alg as GraphLibAlg, alg} from "graphlib";

type sageNodeKey = string;

export interface ISageLinkRelation {
  type: string;
  formula?: string;
}

export interface ISageLink {
  title: string;
  sourceNode: sageNodeKey;
  targetNode: sageNodeKey;
  relation?: ISageLinkRelation;
  transferNode?: string;
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
    graphlibGraph.setEdge(l.sourceNode, l.targetNode,
      { title: l.title, transferNode: l.transferNode ? l.transferNode : "" } );
  });
  return graphlibGraph;
}

function countMultiLinkTargetNodes(g) {
  return g.nodes()
    .map( (node: string) => (g.inEdges(node).length > 1) ? 1 : 0 )
    .reduce( (a: number, b: number) => (a + b), 0 );
}

function countAccumulatorNodes(g) {
  return g.nodes()
    .map( (node: string) => (g.node(node).isAccumulator ? 1 : 0))
    .reduce( (a: number, b: number) => (a + b), 0 );
}

function countUnconnectedNodes(g) {
  // The number of unconnected nodes in the graph is a count of all the normal
  // sorts of nodes that might be used to display a free-standing variable.
  // However, internally, a transfer node is also a unconnected node and must
  // be excluded from the count. This is calculated by finding the number of
  // transfer nodes in the graph and subtracting this from the total number of
  // nodes that have no edges.
  const transferNodes = g.edges().filter( (e) => g.edge(e).transferNode !== "" ).length;
  return g.nodes()
    .map( node => (g.nodeEdges(node).length <= 0 ? 1 : 0))
    .reduce( (a: number, b: number) => (a + b), 0 ) - transferNodes;
}

function countLinearGraphs(g) {
  // This function uses that fact that a component (that is, a free-standing
  // sub-graph in the model) is linear if each node has, at most 1 incoming
  // and 1 outgoing arc. There is one case of a non-linear graph that has this
  // property, which is a ring-graph. This non-linear case can be rejected by
  // observing that a linear model must also have one fewer in (or out) arcs
  // than the number of nodes in the component.
  function isLinear(component: string[]) {
    const atMost1InOutEdges = (node: string) => {
      return g.inEdges(node).length <= 1 && g.outEdges(node).length <= 1;
    };
    const nodesWithAtMost1inAnd1outEdge = component
      .map( (node: string) => (atMost1InOutEdges(node)) ? 1 : 0)
      .reduce( (a: number, b: number) => (a + b), 0 );
    const numberOfInEdges = component
      .map( (node: string) => g.inEdges(node).length )
      .reduce( (a: number, b: number) => (a + b), 0 );
    return nodesWithAtMost1inAnd1outEdge === component.length &&
      numberOfInEdges === component.length - 1;
  }
  return GraphLibAlg.components(g)
    .map( (component) => (component.length > 1 && isLinear(component)) ? 1 : 0 )
    .reduce( (a: number, b: number) => (a + b), 0 );
}

function anyBranches(g) {
  const branchedOrJoinedNodeCount = g.nodes()
    .map( (node: string) => ((g.inEdges(node).length > 1 || g.outEdges(node).length > 1 ) ? 1 : 0))
    .reduce( (a: number, b: number) => (a + b), 0 );
  return branchedOrJoinedNodeCount > 0;
}

function countIndependentGraphs(g) {
  // Independent graphs are all all the disconnected sub-graphs that have two
  // or more nodes. This means that single, free standing nodes without any
  // links to other nodes are not counted as an independent graph.
  return GraphLibAlg.components(g)
    .map( component => (component.length > 1) ? 1 : 0 )
    .reduce( (a: number, b: number) => (a + b), 0 );
}

function countLinks(g) {
  // The number of links in a graph is complicated by the presence of transfer
  // links. These are represented as extra, unconnected nodes in the graph
  // and with simple links -- but they are drawn as two links, connecting the
  // source node to the "unconnected" transfer node and finally from the
  // transfer node to the target node. For this reason, ordinary links count as
  // a single link and transfer links count as 2.
  return g.edges()
    .map( edge => (g.edge(edge).transferNode === "") ? 1 : 2 )
    .reduce( (a: number, b: number) => (a + b), 0 );
}

function countMultiplePaths(g) {
  return 43;
}

export function getTopology(sageModelGraph: ISageGraph) {
  const g = getAnalysisGraph(sageModelGraph);

  const nodeCount = g.nodeCount();
  const linkCount = countLinks(g);
  const multiLinkTargetNodeCount = countMultiLinkTargetNodes(g);
  const collectorNodeCount = countAccumulatorNodes(g);
  const independentGraphCount = countIndependentGraphs(g); // GraphLibAlg.components(g).length;
  const unconnectedNodeCount = countUnconnectedNodes(g);
  const linearGraphCount = countLinearGraphs(g);
  const feedbackGraphCount = 0; // TBD.
  const branchedGraphCount = 0; // TBD.

  const cycleCount = GraphLibAlg.findCycles(g).length;
  const isBranched = anyBranches(g);
  // const hasMultiplePaths = (! isLinear) &&
  //                          (multiLinkTargetNodeCount > 0) &&
  //                          (countMultiplePaths(g) > 0);

  return {
    nodeCount,
    linkCount,
    multiLinkTargetNodeCount,
    collectorNodeCount,
    independentGraphCount,
    unconnectedNodeCount,
    linearGraphCount,
    feedbackGraphCount,
    branchedGraphCount,

    cycleCount,
    isBranched
    // hasMultiplePaths
  };
}
