/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const Migrations          = require("../data/migrations/migrations");
const DiagramNode         = require("../models/node");
const TransferNode        = require("../models/transfer");
const ImportActions       = require("../actions/import-actions");
const GraphPrimitive      = require("../models/graph-primitive");

class MySystemImporter {
  private graphStore: any;
  private settings: any;
  private paletteStore: any;

  constructor(graphStore, settings, paletteStore) {
    this.graphStore = graphStore;
    this.settings = settings;
    this.paletteStore = paletteStore;
  }

  importData(data) {
    Migrations.update(data);
    // Synchronous invocation of actions / w trigger
    ImportActions.import.trigger(data);
    this.importNodes(data.nodes);
    this.importLinks(data.links);
    // set the nextID counters
    GraphPrimitive.initCounters({nodes: this.graphStore.getNodes(), links: this.graphStore.getLinks()});
    return this.graphStore.setFilename(data.filename || "New Model");
  }

  importNode(nodeSpec) {
    const { data } = nodeSpec;
    const { key } = nodeSpec;
    if (data.paletteItem) {
      data.image = __guard__(this.paletteStore.store.findByUUID(data.paletteItem), x => x.image);
    }
    if (/^Transfer/.test(nodeSpec.key)) {
      return new TransferNode(data, key);
    } else {
      return new DiagramNode(data, key);
    }
  }

  importNodes(importNodes) {
    for (let nodespec of importNodes) {
      const node = this.importNode(nodespec);
      // ensure id matches key for imported documents
      node.id = node.key;
      this.graphStore.addNode(node);
    }
    // prevent unused default return value
  }

  importLinks(links) {
    for (let link of links) {
      this.graphStore.importLink(link);
      // ensure id matches key for imported documents
      link.id = link.key;
    }
    // prevent unused default return value
  }
}

module.exports = MySystemImporter;

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}