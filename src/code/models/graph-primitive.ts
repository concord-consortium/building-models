const _ = require("lodash");

// GraphPrimitive is the basis for the Node and Link classes.
// They share a common ID generation mechanism mostly.
export class GraphPrimitive {
  public static counters;

  public static initialize() {
    GraphPrimitive.counters = {};
  }

  public static resetCounters() {
    return GraphPrimitive.counters = {};
  }

  public static initCounters(options) {
    const {links, nodes} = options;
    // transfer nodes are in the node list so first pull them out
    const transferNodes = _.filter(nodes, node => /^Transfer-/.test(node.id));
    const diagramNodes = _.filter(nodes, node => /^Node-/.test(node.id));
    return GraphPrimitive.counters = {
      Link: GraphPrimitive.findMaxID(links) + 1,
      Transfer: GraphPrimitive.findMaxID(transferNodes) + 1,
      Node: GraphPrimitive.findMaxID(diagramNodes) + 1
    };
  }

  public static findMaxID(list) {
    let maxID = 0;
    for (const item of list) {
      const id = item.id.split("-").pop();
      maxID = Math.max(maxID, parseInt(id, 10));
    }
    return maxID;
  }

  public static nextID(type) {
    if (!GraphPrimitive.counters[type]) {
      GraphPrimitive.counters[type] = 0;
    }
    GraphPrimitive.counters[type]++;
    return `${type}-${GraphPrimitive.counters[type]}`;
  }
  public id: string;
  public type: string;
  public key: string;

  constructor() {
    this.id = GraphPrimitive.nextID(this.type);
    this.key = this.id;
  }
}

GraphPrimitive.initialize();
