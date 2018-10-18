/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// GraphPrimitive is the basis for the Node and Link classes.
// They share a common ID generation mechanism mostly.
let GraphPrimitive;
module.exports = (GraphPrimitive = (function() {
  GraphPrimitive = class GraphPrimitive {
    static initClass() {
      this.counters = {};
  
      this.prototype.type = "GraphPrimitive";
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
      for (let item of Array.from(list)) {
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
  };
  GraphPrimitive.initClass();
  return GraphPrimitive;
})());
