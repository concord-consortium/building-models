const _ = require("lodash");
import { Graph as AnalysisGraph, alg as GraphLibAlg } from "graphlib";

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

export interface ITopoReport {
  links: number;
  nodes: number;
  unconnectedNodes: number;
  collectorNodes: number;
  multiLinkTargetNodes: number;
  graphs: number;
  linearGraphs: number;
  feedbackGraphs: number;
  branchedGraphs: number;
  multiPathGraphs: number;
}

export function getAnalysisGraph(sageModelGraph: ISageGraph, swapTransferSource = false) {
  // Returns an analysis graph from a serialized sage graph.
  //
  // Transfer links complicate this step as they are represented, in the sage
  // model, as additional, unconnected nodes with control data defining the
  // transfer's behavior. The source and target nodes of a transfer link are
  // represented by a single link with some control data that references the
  // transfer node. (One might think of this as the transfer node drawn -- as a
  // valve icon -- hovering over the link.)
  //
  // To make this all work, the analysis graph is built from the serialized sage
  // model by first creating all the nodes in the model and then inspecting all
  // the links in the model and building the edges of the analysis graph based
  // on the particulars of the links. In particular, transfer links are replaced
  // with two links -- from the source-node to the transfer-node, and from the
  // transfer-node to the target-node. Ordinary links simply link their nodes,
  // from source to target, as one would expect.
  //
  // As a result, the transfer nodes are no longer seen as unconnected nodes,
  // and this makes counting links and nodes straightforward.
  //
  // This does have a drawback with respect to linearity and feedback. Although
  // this implementation maintains the link direction with consistency in how
  // the user creates the link -- that is, the source "links to" the target,
  // it would also be reasonable to reverse the link between the source node
  // and the transfer node since the transfer nodes do effect the value the
  // source node during a transfer.
  //
  // When the swapTransferSource flag is true, the direction of the source link
  // is reversed so the transfer node "links to" the source node. Doing so
  // facilitates the detection of feedback at the cost of messing up the tests
  // for linearity.
  //
  // Because this analysis model also allows a model to have more than 1 link
  // between the same 2 nodes. This has two consequences for the analysis graph:
  // first, it must be a multigraph; and second, all edges must be labeled.

  const graphlibGraph = new AnalysisGraph({ multigraph: true });

  sageModelGraph.nodes.forEach((n) => {
    graphlibGraph.setNode(n.key, { isAccumulator: n.data && n.data.isAccumulator });
  });

  const hasValidTransferNode = (link: ISageLink) =>
    link.transferNode
    && (link.transferNode !== "")
    && graphlibGraph.hasNode(link.transferNode);

  const setEdge = (s, t, link, label) => {
    const linkData = {
      title: link.title,
      transferNode: hasValidTransferNode(link) ? link.transferNode : "",
      relation: link.relation ? link.relation : null,
      source: link.sourceNode
    };
    graphlibGraph.setEdge(s, t, linkData, label);
  };

  sageModelGraph.links.forEach((l) => {
    if (hasValidTransferNode(l)) {
      if (swapTransferSource) {
        setEdge(l.transferNode, l.sourceNode, l, "source-to-transfer-node");
      } else {
        setEdge(l.sourceNode, l.transferNode, l, "source-to-transfer-node");
      }
      setEdge(l.transferNode, l.targetNode, l, "transfer-node-to-target");
    } else {
      setEdge(l.sourceNode, l.targetNode, l, "normal-link");
    }
  });
  return graphlibGraph;
}

function countMultiLinkTargetNodes(g) {
  // Returns the number of nodes that have 2 or more incoming edges. This is
  // the count of ALL nodes in all the sub-graphs of the model.
  return g.nodes().filter((node: string) => g.inEdges(node).length > 1).length;
}

function countCollectorNodes(g) {
  // Returns the number of nodes, in all the sub-graphs of the model, that are
  // flagged as accumulators (which is what makes it a collector node).
  return g.nodes().filter((node: string) => g.node(node).isAccumulator).length;
}

function countUnconnectedNodes(g) {
  // Returns the number of unconnected nodes in the graph. These are the normal
  // sorts of nodes that might be used to display a free-standing variable.
  return g.nodes().filter((node: string) => g.nodeEdges(node).length <= 0).length;
}

function countLinearGraphs(g) {
  // This function uses that fact that a component (that is, a free-standing
  // sub-graph in the model) is linear if each node has, at most 1 incoming
  // and 1 outgoing arc. This almost works, except for 1 case.
  //
  // The one shape that meets the above condition and still is non-linear is a
  // ring-graph. This non-linear case can be rejected by observing that a linear
  // model must also have one fewer in (or out) arcs than the number of nodes in
  // the component (sub-graph).
  //
  // We make this a little easier by defining a predicate, isLinear(), that
  // applies the two tests for a linear sub-graph. Then this predicate is
  // used to count the sub-graphs in this model where the predicate is true.

  function isLinear(subGraph: string[]) {
    const atMost1InOutEdges = (node: string) => {
      return g.inEdges(node).length <= 1 && g.outEdges(node).length <= 1;
    };
    const nodesWithAtMost1inAnd1outEdge =
      subGraph.filter((node: string) => (atMost1InOutEdges(node))).length;
    const numberOfInEdges =
      subGraph.map((node: string) => g.inEdges(node).length)
        .reduce((a: number, b: number) => (a + b), 0);  // Sum the map.
    return nodesWithAtMost1inAnd1outEdge === subGraph.length &&
      numberOfInEdges === subGraph.length - 1;
  }

  return GraphLibAlg.components(g)
    .filter((subGraph) => (subGraph.length > 1 && isLinear(subGraph)))
    .length;
}

function countBranchesAndJoins(g) {
  // Returns the number of subGraphs in the model that contain 1 or more
  // branching or joining nodes. A branching node is defined as a node with
  // 2 or more outgoing edges. Similarly, a joining node is defined as a node
  // with 2 or more incoming edges.
  const hasABranchOrJoinNode = (subGraph) => {
    return subGraph.filter(node =>
      (g.inEdges(node).length > 1 || g.outEdges(node).length > 1)).length > 0;
  };
  return GraphLibAlg.components(g)
    .filter(subGraph => subGraph.length > 2)  // Ignore, unless 3 or more nodes.
    .filter(subGraph => hasABranchOrJoinNode(subGraph))
    .length;
}

function countIndependentGraphs(g) {
  // Independent graphs are all all the disconnected sub-graphs that have two
  // or more nodes. This means that single, free standing nodes without any
  // links to other nodes are not counted as an independent graph.
  return GraphLibAlg.components(g).filter(subGraph => (subGraph.length > 1)).length;
}

function countGraphsWithFeedback(g) {
  // A sub-graph is counted as having feedback if it has any cycles -- that is,
  // at least one node can reach itself.
  //
  // The library method, findCycles() returns an array of node arrays, where
  // each node array has all the nodes that are in that cycle. A sub-graph could
  //  contain multiple and disjoint cycles, in which case findCycles() would
  // return several node arrays for a particular sub-graph. Here, we only want
  // to count a particular sub-graph as having feedback once, no mater how many
  // cycles it might contain.
  //
  // Note about transfer links: for this feedback to be determined correctly
  // when the sub-graph contains transfer links, the link between the transfer
  // node and the source node must be reversed so that it points "to" the
  // the source link. Therefore, this method must be called with an analysis
  // graph that is constructed with the swapTransferSource flag set to true.

  const cycles = _.flatten(GraphLibAlg.findCycles(g));
  const hasFeedback = subGraph => _.intersection(subGraph, cycles).length > 0 ;

  return GraphLibAlg.components(g)
    .filter(subGraph => subGraph.length > 1)   // Only care, if 2 or more nodes.
    .filter(subGraph => hasFeedback(subGraph))
    .length;
}

function countGraphsWithMultiPaths(g) {
  const sinks = g.sinks();

  const componentHasMultiPaths = (component) => {
    while (component.length > 0) {
      // do a breadth-first search from nodes to all other nodes (checking for cycles on the way)
      // we exit early when we visit a sink more than once as that signifies a multi-path
      const node = component.shift();
      const visited: Record<string, number> = {[node]: 1};
      const queue = [node];
      while (queue.length > 0) {
        const visiting = queue.shift();
        const successors = g.successors(visiting);
        while (successors.length > 0) {
          const successor = successors.shift();
          visited[successor] = visited[successor] || 0;
          visited[successor]++;
          if (visited[successor] === 1) {
            // first time visiting this node, add it to the search list
            queue.push(successor);
          } else if ((visited[successor] > 1) && (sinks.indexOf(successor) !== -1)) {
            // second time visiting a sink so there is a multi-path to the sink
            return true;
          }
        }
      }
    }
    return false;
  };

  return GraphLibAlg.components(g).
    filter(componentHasMultiPaths)
    .length;
}

export function getTopology(sageModelGraph: ISageGraph) {

  const g = getAnalysisGraph(sageModelGraph);

  const links = g.edgeCount();

  const nodes = g.nodeCount();
  const unconnectedNodes = countUnconnectedNodes(g);
  const collectorNodes = countCollectorNodes(g);
  const multiLinkTargetNodes = countMultiLinkTargetNodes(g);

  const graphs = countIndependentGraphs(g);
  const linearGraphs = countLinearGraphs(g);

  const gPrime = getAnalysisGraph(sageModelGraph, true);
  const feedbackGraphs = countGraphsWithFeedback(gPrime);

  const branchedGraphs = countBranchesAndJoins(g);
  const multiPathGraphs = countGraphsWithMultiPaths(g);

  return {
    links,
    nodes,
    unconnectedNodes,
    collectorNodes,
    multiLinkTargetNodes,
    graphs,
    linearGraphs,
    feedbackGraphs,
    branchedGraphs,
    multiPathGraphs
  };
}
