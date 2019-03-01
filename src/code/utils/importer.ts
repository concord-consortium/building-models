/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { migrationUpdate } from "../data/migrations/migrations";
import { Node } from "../models/node";
import { TransferModel } from "../models/transfer";
import { ImportActions } from "../actions/import-actions";
import { GraphPrimitive } from "../models/graph-primitive";
import { GraphStoreClass } from "../stores/graph-store";

export class Importer {
  private graphStore: GraphStoreClass;
  private settings: any;
  private paletteStore: any;

  constructor(graphStore, settings, paletteStore) {
    this.graphStore = graphStore;
    this.settings = settings;
    this.paletteStore = paletteStore;
  }

  public importData(data) {
    migrationUpdate(data);
    // Synchronous invocation of actions / w trigger
    ImportActions.import.trigger(data);
    this.importNodes(data.nodes);
    this.importLinks(data.links);
    // set the nextID counters
    GraphPrimitive.initCounters({nodes: this.graphStore.getNodes(), links: this.graphStore.getLinks()});
    return this.graphStore.setFilename(data.filename || "New Model");
  }

  public importNode(nodeSpec) {
    const { data } = nodeSpec;
    const { key } = nodeSpec;
    if (data.paletteItem) {
      data.image = __guard__(this.paletteStore.findByUUID(data.paletteItem), x => x.image);
    }
    if (/^Transfer/.test(nodeSpec.key)) {
      return new TransferModel(data, key);
    } else {
      return new Node(data, key);
    }
  }

  public importNodes(importNodes) {
    for (const nodespec of importNodes) {
      const node = this.importNode(nodespec);
      // ensure id matches key for imported documents
      node.id = node.key;
      this.graphStore.addNode(node);
    }
    // prevent unused default return value
  }

  public importLinks(links) {
    for (const link of links) {
      this.graphStore.importLink(link);
      // ensure id matches key for imported documents
      link.id = link.key;
    }
    // prevent unused default return value
  }
}

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
