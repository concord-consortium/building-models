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
  // Builds an analysis graph from a serialized sage graph. Only the useful
  // properties of the nodes and links should be included in the constructed
  // graph, as is dictated by the required analysis.
  const graphlibGraph = new AnalysisGraph();
  sageModelGraph.nodes.forEach((n) => {
    graphlibGraph.setNode(
      n.key,
      {
        isAccumulator: n.data && n.data.isAccumulator
      }
    );
  });
  sageModelGraph.links.forEach((l) => {
    graphlibGraph.setEdge(
      l.sourceNode,
      l.targetNode,
      {
        title: l.title,
        transferNode: l.transferNode ? l.transferNode : "",
        relation: l.relation ? l.relation : null,
        source: l.sourceNode
      }
    );
  });
  return graphlibGraph;
}

function countMultiLinkTargetNodes(g) {
  // Returns the number of nodes that have 2 or more incoming edges. This is
  // the count of ALL nodes in all the sub-graphs of the model.
  return g.nodes()
    .filter( (node: string) => g.inEdges(node).length > 1 )
    .length;
}

function countCollectorNodes(g) {
  // Returns the number of nodes, in all the sub-graphs of the model, that are
  // flagged as accumulators (that is, collector nodes).
  return g.nodes()
    .filter( (node: string) => g.node(node).isAccumulator)
    .length;
}

function countUnconnectedNodes(g) {
  // Returns the number of unconnected nodes in the graph. These are the normal
  // sorts of nodes that might be used to display a free-standing variable.
  // However, internally, a transfer node is also a unconnected node and must
  // be excluded from the count. This is calculated by finding the number of
  // transfer nodes in the graph and subtracting this from the total number of
  // nodes that have no edges.
  const transferNodes = g.edges()
    .filter( (e: string) => g.edge(e).transferNode !== "" );
  return g.nodes()
    .filter( (node: string) => g.nodeEdges(node).length <= 0 )
    .length - transferNodes.length;
}

function countLinearGraphs(g) {
  // This function uses that fact that a component (that is, a free-standing
  // sub-graph in the model) is linear if each node has, at most 1 incoming
  // and 1 outgoing arc. There is one case of a non-linear graph that has this
  // property, which is a ring-graph. This non-linear case can be rejected by
  // observing that a linear model must also have one fewer in (or out) arcs
  // than the number of nodes in the component.
  //
  // We make this a little easier by defining a predicate, isLinear(), that
  // applies the two tests for a linear sub-graph. Then this predicate is
  // used to count the sub-graphs in this model where the predicate is true.
  function isLinear(subGraph: string[]) {
    const atMost1InOutEdges = (node: string) => {
      return g.inEdges(node).length <= 1 && g.outEdges(node).length <= 1;
    };
    const nodesWithAtMost1inAnd1outEdge =
      subGraph.filter( (node: string) => (atMost1InOutEdges(node)) ).length;
    const numberOfInEdges =
      subGraph.map( (node: string) => g.inEdges(node).length )
        .reduce( (a: number, b: number) => (a + b), 0 );  // Sum the map.
    return nodesWithAtMost1inAnd1outEdge === subGraph.length &&
      numberOfInEdges === subGraph.length - 1;
  }
  return GraphLibAlg.components(g)
    .filter( (subGraph) => (subGraph.length > 1 && isLinear(subGraph)) )
    .length;
}

function countBranchesAndJoins(g) {
  // Returns the number of subGraphs in the model that contain 1 or more
  // branching or joining nodes. A branching node is defined as a node with
  // 2 or more outgoing edges. Similarly, a joining node is defined as a node
  // with 2 or more incoming edges.
  const hasABranchOrJoinNode = (nodes) => {
    return nodes.filter( node => (g.inEdges(node).length > 1 ||
      g.outEdges(node).length > 1 ) ).length > 0;
  };
  return GraphLibAlg.components(g)
    .filter( subGraph => subGraph.length > 2 )  // Ignore unless 3 or more nodes.
    .filter( subGraph => hasABranchOrJoinNode(subGraph) )
    .length;
}

function countIndependentGraphs(g) {
  // Independent graphs are all all the disconnected sub-graphs that have two
  // or more nodes. This means that single, free standing nodes without any
  // links to other nodes are not counted as an independent graph.
  return GraphLibAlg.components(g)
    .filter ( subGraph => (subGraph.length > 1) )
    .length;
}

function countLinks(g) {
  // The number of links in a graph is complicated by the presence of transfer
  // links. These are represented, in the sage model as extra, unconnected
  // nodes. But the transfer links between the "real" nodes, as it were, are
  // represented as a single link, but are drawn in the UI as two: one from the
  // source node to the transfer-node (that looks like a gate valve) and one
  // from the transfer-node to the target node. For analysis purposes, these
  // links are supposed to be counted as they are drawn, that is, as two links.
  // For this reason, ordinary links count as a single link and transfer links
  // count as 2.
  return g.edges()
    .map( (edge: string) => (g.edge(edge).transferNode === "") ? 1 : 2 )
    .reduce( (a: number, b: number) => (a + b), 0 );  // Sum the 1's and 2's in the map.
}

function countGraphsWithFeedback(g) {
  // A sub-graph is counted as having feedback in two cases. First, if it has
  // any topological cycles -- that is, at least one node can reach itself; or
  // Second, if there are any transfer links present in the sub-graph.
  //
  // Computing this is a little tricky. The library method, findCycles() returns
  // an array of node arrays, where each node array has all the nodes that are
  // in the cycle.
  //
  // It is also possible that a sub-graph could contain multiple and disjoint
  // cycles, in which case findCycles() would return several node arrays
  // for a particular sub-graph. But we only want to count a particular sub-
  // graph as having feedback once, no mater how many cycles it might contain.
  //
  // To make this simpler, we first create two lists of nodes from all the
  // sub-graphs of the model. The first is a list of all nodes that are in
  // a cycle. The second is a list of all the sourceNodes referenced in
  // transfer links. A sub-graph has feedback if it has any nodes in either of
  // these two lists. Using the hasFeedback() predicate, we count up all the
  // sub-graphs in the model where this predicate is true.
  const nodesInCycles = _.flatten(GraphLibAlg.findCycles(g));
  const sourceNodes = g.edges()
    .filter( (edge: string) => (g.edge(edge).transferNode !== "") )
    .map( (edge: string) => g.edge(edge).source );
  const hasFeedback = (subGraph: string[]): boolean => {
    return ((_.intersection(subGraph, nodesInCycles).length > 0) ||
            ( _.intersection(subGraph, sourceNodes).length > 0));
  };
  return GraphLibAlg.components(g)
    .filter( subGraph => subGraph.length > 1 )   // Only care, if 2 or more nodes.
    .filter( subGraph => hasFeedback(subGraph) )
    .length;
}

function countMultiplePaths(g) {
  return 43;
}

export function getTopology(sageModelGraph: ISageGraph) {
  const g = getAnalysisGraph(sageModelGraph);

  const nodeCount = g.nodeCount();
  const linkCount = countLinks(g);
  const multiLinkTargetNodeCount = countMultiLinkTargetNodes(g);
  const collectorNodeCount = countCollectorNodes(g);
  const independentGraphCount = countIndependentGraphs(g); // GraphLibAlg.components(g).length;
  const unconnectedNodeCount = countUnconnectedNodes(g);
  const linearGraphCount = countLinearGraphs(g);
  const graphsWithFeedbackCount = countGraphsWithFeedback(g);
  const branchedGraphCount = countBranchesAndJoins(g);
  
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
    graphsWithFeedbackCount,
    branchedGraphCount,
    // hasMultiplePaths
  };
}
