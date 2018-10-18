// TODO: remove when modules are converted to TypeScript style modules
export {}

// GraphPrimitive is the basis for the Node and Link classes.
// They share a common ID generation mechanism mostly.
class GraphPrimitive {
  static counters;
  public id: string;
  public type: string;
  public key: string;

  static initialize() {
    GraphPrimitive.counters = {};
  }

  static resetCounters() {
    return GraphPrimitive.counters = {};
  }

  static initCounters(options) {
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

  static findMaxID(list) {
    let maxID = 0;
    for (let item of list) {
      const id = item.id.split("-").pop();
      maxID = Math.max(maxID, parseInt(id, 10));
    }
    return maxID;
  }

  static nextID(type) {
    if (!GraphPrimitive.counters[type]) {
      GraphPrimitive.counters[type] = 0;
    }
    GraphPrimitive.counters[type]++;
    return `${type}-${GraphPrimitive.counters[type]}`;
  }

  constructor() {
    this.id = GraphPrimitive.nextID(this.type);
    this.key= this.id;
  }
}

GraphPrimitive.initialize();

module.exports = GraphPrimitive;