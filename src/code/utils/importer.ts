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
import { PaletteStoreClass } from "../stores/palette-store";

export class Importer {
  private graphStore: GraphStoreClass;
  private paletteStore: PaletteStoreClass;

  constructor(graphStore, settings, paletteStore) {
    this.graphStore = graphStore;
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

    // Update with the saved filename
    // NOTE: we used to use "New Model" as the default but this caused hash(dataOnLoad) !== hash(dataOnSave)
    // which then caused immediate saves when a new model was loaded.  These immediate saves caused the linked
    // interactive UI to show as it compares save times to figure out it content changed.
    // We opted to remove the default here instead of setting the default in graphStore.init() so that old
    // saved models, with null as their filename, would hash the same.
    return this.graphStore.setFilename(data.filename);
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
      this.graphStore.addNode(node, {skipUndoRedo: true});
    }
    // prevent unused default return value
  }

  public importLinks(links) {
    for (const link of links) {
      this.graphStore.importLink(link, {skipUndoRedo: true});
      // ensure id matches key for imported documents
      link.id = link.key;
    }
    // prevent unused default return value
  }
}

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
