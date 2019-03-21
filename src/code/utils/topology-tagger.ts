
import { Graph, alg} from "graphlib";

export interface ILinkStruct {
  sourceNode: string;
  targetNode: string;
  title: string;
}

export interface InodeDataStruct {
  title: string;
  isAccumulator?: boolean;
}

export interface INodeStruct {
  key: string;
  data: InodeDataStruct;
}

export interface ISageGraphStruct {
  links: ILinkStruct[];
  nodes: INodeStruct[];
}

export function convertSageModelToGraph(sageModelGraph: ISageGraphStruct) {
  const graphlibGraph = new Graph();
  sageModelGraph.nodes.forEach((n) => {
    graphlibGraph.setNode(n.key, n.data.title);
  });
  sageModelGraph.links.forEach((l) => {
    graphlibGraph.setEdge(l.sourceNode, l.targetNode, l.title);
  });
  return graphlibGraph;
}

export function countNodes(g: Graph) {
  return g.nodeCount();
}

export function getCycles(g: Graph) {
  return alg.findCycles(g);
}
