/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * DS208: Avoid top-level this
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");
const log = require("loglevel");
const Reflux = require("reflux");
import * as $ from "jquery";

import { Importer } from "../utils/importer";
import { Link } from "../models/link";
import { Node } from "../models/node";
import { TransferModel } from "../models/transfer";
import { undoRedoInstance, UndoRedoManager } from "../utils/undo-redo";
import { SelectionManager } from "../models/selection-manager";
import { PaletteStore } from "../stores/palette-store";
import { tr } from "../utils/translate";
import { latestVersion } from "../data/migrations/migrations";
import { PaletteDeleteDialogStore } from "../stores/palette-delete-dialog-store";
import { AppSettingsStore } from "../stores/app-settings-store";
import { SimulationStore, SimulationActions } from "../stores/simulation-store";
import { GraphActions } from "../actions/graph-actions";
import { CodapActions } from "../actions/codap-actions";
import { CodapConnect } from "../models/codap-connect";
import { RelationFactory } from "../models/relation-factory";
import { GraphPrimitive } from "../models/graph-primitive";
import { Mixin } from "../mixins/components";
import { StoreUnsubscriber, StoreClass } from "./store-class";
import { GraphView } from "../views/graph-view";
import { InspectorPanelActions } from "./inspector-panel-store";
import { getTopology } from "../utils/topology-tagger";
import { urlParams } from "../utils/url-params";
const DEFAULT_CONTEXT_NAME = "building-models";

interface GraphSettings {
  nodes: any; // TODO: get concrete type
  links: any; // TODO: get concrete type
  description: any; // TODO: get concrete type
}

interface NodeMap {
  [key: string]: Node;
}

export declare class GraphStoreClass extends StoreClass {
  public nodeKeys: NodeMap;
  public readonly undoRedoManager: UndoRedoManager;
  public readonly selectionManager: SelectionManager;
  public readonly filename;

  public readonly usingCODAP: boolean;
  public readonly usingLara: boolean;
  public readonly codapStandaloneMode: boolean;

  public readonly currentSliderNodeKey: string;

  public readonly ready: boolean;

  public init(context?): void;
  public resetSimulation(): void;
  public updateSimulationData(data: any): void;
  public paletteDelete(status: any): void;
  public undo(fromCODAP?: boolean): void;
  public redo(fromCODAP?: boolean): void;
  public setSaved(): void;
  public revertToOriginal(): void;
  public revertToLastSave(): void;
  public setUsingCODAP(usingCODAP: boolean): void;
  public setUsingLara(usingLara: boolean): void;
  public setCodapStandaloneMode(codapStandaloneMode: boolean): void;
  public addChangeListener(listener: any): void;
  public addFilenameListener(listener: any): void;
  public setFilename(filename: string): void ;
  public getLinks(): Link[];
  public getNodes(): Node[];
  public hasLink(link: Link): boolean;
  public hasNode(node: Node): boolean;
  public importNode(nodeSpec: any): Node;
  public importLink(linkSpec: any): Link;
  public addLink(link: Link): void;
  public removeLink(link: Link): void;
  public isUniqueTitle(title: string, skipNode: boolean, nodes?: Node[]): boolean;
  public ensureUniqueTitle(node: Node, newTitle: string): string;
  public addNode(node: Node): void;
  public removeNode(nodeKey: string): void;
  public moveNodeCompleted(nodeKey: string, leftDiff: number, topDiff: number): void;
  public moveNode(nodeKey: string, leftDiff: number, topDiff: number): void;
  public selectedNodes(): Node[];
  public selectedLinks(): Link[];
  public editingNode(): Node | null;
  public editNode(nodeKey: string): Node;
  public selectNode(nodeKey: string): Node;
  public changeNode(data: any, node?: Node): void;
  public changeNodeOutsideUndoRedo(node: Node, data: any, notifyCodap: boolean): void;
  public changeNodeProperty(property: string, value: any, node: Node): void;
  public changeNodeWithKey(key: string, data: any): void;
  public startNodeEdit(): void;
  public endNodeEdit(): void;
  public clickLink(link: Link, multipleSelectionsAllowed: boolean): void;
  public editLink(link: Link): Link;
  public changeLink(link: Link, changes: any): void;
  public newLinkFromEvent(info: any): void;
  public deleteAll(): void;
  public removeSelectedNodes(): void;
  public removeSelectedLinks(): void;
  public deleteSelected(): void;
  public removeLinksForNode(node): void;
  public getDescription(nodes: Node[], links: Link[]): any;
  public getMinimumSimulationType(): any;
  public getMinimumComplexity(): any;
  public loadData(data: any): void;
  public loadDataFromUrl(url: string): void;
  public serializeGraph(palette: any): any;
  public toJsonString(palette: any): string;
  public getGraphState(): GraphSettings;
  public updateListeners(): void;
  public nudgeNodeWithKeyInitialValue(key: string, delta: number);
  public waitUntilReady(callback: () => void): void;
}

export const GraphStore: GraphStoreClass = Reflux.createStore({
  init(context) {
    this.linkKeys           = {};
    this.nodeKeys           = {};
    this.loadListeners      = [];
    this.filename           = null;
    this.filenameListeners  = [];
    this.ready = false;

    // wait because of require order
    setTimeout(() => {
      this.undoRedoManager    = undoRedoInstance({debug: false, context});
      this.ready = true;
    }, 1);
    this.selectionManager   = new SelectionManager();
    PaletteDeleteDialogStore.listen(this.paletteDelete.bind(this));

    SimulationActions.createExperiment.listen(this.resetSimulation.bind(this));
    SimulationActions.setDuration.listen(this.resetSimulation.bind(this));
    SimulationActions.capNodeValues.listen(this.resetSimulation.bind(this));
    SimulationActions.simulationFramesCreated.listen(this.updateSimulationData.bind(this));

    this.usingCODAP = false;
    this.usingLara = false;
    this.codapStandaloneMode = false;

    return this.lastRunModel = "";
  },   // string description of the model last time we ran simulation

  // waits for undoRedoManager to be ready
  waitUntilReady(callback) {
    if (this.ready) {
      callback();
    } else {
      setTimeout(() => this.waitUntilReady(callback), 1);
    }
  },

  resetSimulation() {
    for (const node of this.getNodes()) {
      node.frames = [];
    }
    return this.updateListeners();
  },

  _trimSimulation() {
    for (const node of this.getNodes()) {
      // leaving some excess data reduces flicker during rapid changes
      const excessFrames = node.frames.length - (2 * SimulationStore.simulationDuration());
      if (excessFrames > 0) {
        node.frames.splice(0, excessFrames);
      }
    }

  },  // prevent unused default return value

  updateSimulationData(data) {
    const nodes = this.getNodes();
    for (const frame of data) {
      for (let i = 0; i < frame.nodes.length; i++) {
        const node = frame.nodes[i];
        if (nodes[i] != null) {
          nodes[i].frames.push(node.value);
        }
      }
    }

  },  // prevent unused default return value

  paletteDelete(status) {
    const {deleted, paletteItem, replacement} = status;
    if (deleted && paletteItem && replacement) {
      for (const node of this.getNodes()) {
        if (node.paletteItemIs(paletteItem)) {
          this.changeNode({image: replacement.image, paletteItem: replacement.uuid}, node);
        }
      }
    }

  },  // prevent unused default return value

  // This and redo() can be called from three sources, and we can be in two different
  // modes. It can be called from the 1) button press, 2) keyboard, and 3) CODAP action.
  // We can be in CODAP standalone mode or not.
  //
  // The undoRedoManager should handle the undo/redo when EITHER we are not running
  // in CODAP or the undo/redo has been initiated from CODAP
  //
  // CODAP should handle the undo/redo when we are running from CODAP in either
  // standalone or non-standalone mode and CODAP did not initiate the request
  undo(fromCODAP) {
    if (fromCODAP || !this.usingCODAP) {
      return this.undoRedoManager.undo();
    } else {
      return CodapActions.sendUndoToCODAP();
    }
  },

  redo(fromCODAP) {
    if (fromCODAP || !this.usingCODAP) {
      return this.undoRedoManager.redo();
    } else {
      return CodapActions.sendRedoToCODAP();
    }
  },

  setSaved() {
    return this.undoRedoManager.save();
  },

  revertToOriginal() {
    return this.undoRedoManager.revertToOriginal();
  },

  revertToLastSave() {
    return this.undoRedoManager.revertToLastSave();
  },

  setUsingCODAP(usingCODAP) {
    this.usingCODAP = usingCODAP;
  },
  setUsingLara(usingLara) {
    this.usingLara = usingLara;
  },

  setCodapStandaloneMode(codapStandaloneMode) {
    this.codapStandaloneMode = codapStandaloneMode;
  },

  addChangeListener(listener) {
    log.info("adding change listener");
    // wait because of require order
    setTimeout(() => {
      this.undoRedoManager.addChangeListener(listener);
    }, 2);
  },

  addFilenameListener(listener) {
    log.info(`adding filename listener ${listener}`);
    return this.filenameListeners.push(listener);
  },

  setFilename(filename) {
    this.filename = filename;
    return this.filenameListeners.map((listener) =>
      listener(filename));
  },

  getLinks() {
    return ((() => {
      const result: any = [];
      for (const key in this.linkKeys) {
        const value = this.linkKeys[key];
        result.push(value);
      }
      return result;
    })());
  },

  getNodes() {
    return ((() => {
      const result: any = [];
      for (const key in this.nodeKeys) {
        const value = this.nodeKeys[key];
        result.push(value);
      }
      return result;
    })());
  },

  hasLink(link) {
    return (this.linkKeys[link.terminalKey()] != null);
  },

  hasNode(node) {
    return (this.nodeKeys[node.key] != null);
  },

  importNode(nodeSpec) {
    const importer = new Importer(this, AppSettingsStore, PaletteStore);
    const node = importer.importNode(nodeSpec);
    this.addNode(node);
    return node;
  },

  importLink(linkSpec) {
    let transferNode;
    const sourceNode = this.nodeKeys[linkSpec.sourceNode];
    const targetNode = this.nodeKeys[linkSpec.targetNode];
    if (linkSpec.transferNode) { transferNode = this.nodeKeys[linkSpec.transferNode]; }
    linkSpec.sourceNode = sourceNode;
    linkSpec.targetNode = targetNode;
    if (transferNode) {
      linkSpec.transferNode = transferNode;
    } else {
      delete linkSpec.transferNode;
    }
    const link = new Link(linkSpec);
    this.addLink(link);
    return link;
  },

  addLink(link) {
    this.endNodeEdit();
    return this.undoRedoManager.createAndExecuteCommand("addLink", {
      execute: () => this._addLink(link),
      undo: () => this._removeLink(link)
    }
    );
  },

  _addLink(link) {
    if ((link.sourceNode !== link.targetNode) && !this.hasLink(link)) {
      this.linkKeys[link.terminalKey()] = link;
      this.nodeKeys[link.sourceNode.key].addLink(link);
      this.nodeKeys[link.targetNode.key].addLink(link);
    }
    this._graphUpdated();
    return this.updateListeners();
  },


  removeLink(link) {
    this.endNodeEdit();
    return this.undoRedoManager.createAndExecuteCommand("removeLink", {
      execute: () => {
        this._removeLink(link);
        if (link.transferNode != null) { return this._removeTransfer(link); }
      },
      undo: () => {
        if (link.transferNode != null) { this._addTransfer(link); }
        return this._addLink(link);
      }
    }
    );
  },

  _removeLink(link) {
    delete this.linkKeys[link.terminalKey()];
    if (this.nodeKeys[link.sourceNode.key] != null) {
      this.nodeKeys[link.sourceNode.key].removeLink(link);
    }
    if (this.nodeKeys[link.targetNode.key] != null) {
      this.nodeKeys[link.targetNode.key].removeLink(link);
    }
    this._graphUpdated();
    return this.updateListeners();
  },

  isUniqueTitle(title, skipNode, nodes) {
    if (nodes == null) { nodes = this.getNodes(); }
    const nonUniqueNode = (otherNode) => {
      const sameTitle = otherNode.title === title;
      if (skipNode) { return sameTitle && (otherNode !== skipNode); } else { return sameTitle; }
    };
    return !_.find(nodes, nonUniqueNode);
  },

  ensureUniqueTitle(node, newTitle) {
    if (newTitle == null) { newTitle = node.title; }
    const nodes = this.getNodes();
    if (!this.isUniqueTitle(newTitle, node, nodes)) {
      let index = 2;
      const endsWithNumber = / (\d+)$/;
      const matches = newTitle.match(endsWithNumber);
      if (matches) {
        index = parseInt(matches[1], 10) + 1;
        newTitle = newTitle.replace(endsWithNumber, "");
      }
      const template = `${newTitle} %{index}`;
      while (true) {
        newTitle = tr(template, {index: index++});
        if (this.isUniqueTitle(newTitle, node, nodes)) { break; }
      }
    }
    return newTitle;
  },

  addNode(node) {
    this.endNodeEdit();
    node.title = this.ensureUniqueTitle(node);
    console.log("Added node");
    this.undoRedoManager.createAndExecuteCommand("addNode", {
      execute: () => {
        this._addNode(node);
      },
      undo: () => {
        // Remove related variable from CODAP. Note that this is not part of the _removeNode.
        // When we undo "add" operation, it makes perfect sense to cleanup CODAP attribute.
        // However, when node was around for some time, there's some data, and user deletes it, it's safer
        // to leave this data around. User might want to delete it or not.
        CodapConnect.instance(DEFAULT_CONTEXT_NAME).sendDeleteAttribute(node);
        this._removeNode(node);
      }
    });
  },

  removeNode(nodeKey) {
    this.endNodeEdit();
    const node = this.nodeKeys[nodeKey];
    const transferRelation = node.transferLink != null ? node.transferLink.relation : undefined;

    // create a copy of the list of links
    const links = node.links.slice();
    // identify any transfer nodes that need to be removed as well
    const transferLinks: any = [];
    _.each(links, (link) => {
      if (__guard__(link != null ? link.transferNode : undefined, x => x.key) != null) {
        return transferLinks.push(link);
      }
    });

    return this.undoRedoManager.createAndExecuteCommand("removeNode", {
      execute: () => {
        if (node.transferLink != null) {
          node.transferLink.relation = node.transferLink.defaultRelation();
        }
        for (const link of links) { this._removeLink(link); }
        for (const link of transferLinks) { this._removeTransfer(link); }
        return this._removeNode(node);
      },
      undo: () => {
        if (node.transferLink != null) {
          node.transferLink.relation = transferRelation;
        }
        this._addNode(node);
        for (const link of transferLinks) { this._addTransfer(link); }
        for (const link of links) { this._addLink(link); }
      }
    }
    );
  },

  _addNode(node) {
    if (!this.hasNode(node)) {
      this.nodeKeys[node.key] = node;
      this._graphUpdated();
      // In some cases .codapID and .codapName properties might be already set. E.g. when node is re-added because
      // of redoing node add action. Or undoing node remove. If these attributes are set and we create new CODAP
      // variables, it will prevent them from being updated and they will be out of sync.
      node.codapID = null;
      node.codapName = null;
      // add variable to CODAP
      CodapConnect.instance(DEFAULT_CONTEXT_NAME)._createMissingDataAttributes();
      return this.updateListeners();
    }
  },

  _removeNode(node) {
    delete this.nodeKeys[node.key];
    this._graphUpdated();
    return this.updateListeners();
  },

  _addTransfer(link) {
    if (link.transferNode == null) {
      const source = link.sourceNode;
      const target = link.targetNode;
      link.transferNode = new TransferModel({
        x: source.x + ((target.x - source.x) / 2),
        y: source.y + ((target.y - source.y) / 2)
      });
      link.transferNode.setTransferLink(link);
    }
    return this._addNode(link.transferNode);
  },

  _removeTransfer(tLink) {
    const transfer = tLink.transferNode;
    if (!transfer) { return; }

    const links = this.getLinks();
    _.each(links, link => {
      if ((link.sourceNode === transfer) || (link.targetNode === transfer)) {
        return this.removeLink(link);
      }
    });
    return this._removeNode(transfer);
  },

  _graphUpdated() {
    return (() => {
      const result: any = [];
      for (const key in this.nodeKeys) {
        const node = this.nodeKeys[key];
        result.push(node.checkIsInIndependentCycle());
      }
      return result;
    })();
  },

  moveNodeCompleted(nodeKey, leftDiff, topDiff) {
    this.endNodeEdit();
    return this.undoRedoManager.createAndExecuteCommand("moveNode", {
      execute: () => this.moveNode(nodeKey, 0, 0),
      undo: () => this.moveNode(nodeKey, -leftDiff, -topDiff),
      redo: () => this.moveNode(nodeKey, leftDiff, topDiff)
    }
    );
  },

  moveNode(nodeKey, leftDiff, topDiff) {
    const node = this.nodeKeys[nodeKey];
    if (!node) { return; }
    // alert "moveNode:" + nodeKey + " " + node.x + " "
    // console.log "moveNode:", node, leftDiff,  topDiff
    node.x = node.x + leftDiff;
    node.y = node.y + topDiff;
    return this.updateListeners();
  },

  selectedNodes() {
    return this.selectionManager.getNodeInspection() || [];
  }, // add or [] into getNodeInspection() ?

  selectedLinks() {
    return this.selectionManager.getLinkInspection() || [];
  }, // add or [] into getLinkInspection() ?

  editingNode() {
    return this.selectionManager.selection(SelectionManager.NodeTitleEditing)[0] || null;
  },

  editNode(nodeKey) {
    return this.selectionManager.selectNodeForTitleEditing(this.nodeKeys[nodeKey]);
  },

  selectNode(nodeKey) {
    this.endNodeEdit();
    return this.selectionManager.selectNodeForInspection(this.nodeKeys[nodeKey]);
  },


  _notifyNodeChanged(node) {
    this._maybeChangeSelectedItem(node);
    return this.updateListeners();
  },

  changeNode(data, node) {
    const _node = node || this.selectedNodes();
    const nodes = [].concat(_node); // force an array of nodes
    return (() => {
      const result: any = [];
      for (node of nodes) {
        if (node) {
          const originalData = {
            title: node.title,
            image: node.image,
            paletteItem: node.paletteItem,
            color: node.color,
            initialValue: node.initialValue,
            value: node.value || node.initialValue,
            min: node.min,
            max: node.max,
            isAccumulator: node.isAccumulator,
            allowNegativeValues: node.allowNegativeValues,
            combineMethod: node.combineMethod,
            valueDefinedSemiQuantitatively: node.valueDefinedSemiQuantitatively
          };

          let nodeChanged = false;
          for (const key in data) {
            if (data.hasOwnProperty(key)) {
              if (data[key] !== originalData[key]) { nodeChanged = true; }
            }
          }

          if (nodeChanged) {        // don't do anything unless we've actually changed the node

            let changedLinks, link, originalRelations;
            const accumulatorChanged = (data.isAccumulator != null) &&
                                  (!!data.isAccumulator !== !!originalData.isAccumulator);

            if (accumulatorChanged) {
              // all inbound links are invalidated
              changedLinks = [].concat(node.inLinks())
              // along with outbound transfer links
                .concat(_.filter(node.outLinks(), link =>
                  (link.relation.type === "transfer") ||
                                  (link.relation.type === "initial-value")
                ));
              originalRelations = {};
              for (link of changedLinks) {
                originalRelations[link.key] = link.relation;
              }
            }

            this.undoRedoManager.startCommandBatch();
            this.undoRedoManager.createAndExecuteCommand("changeNode", {
              execute: () => {
                if (accumulatorChanged) {
                  for (link of changedLinks) {
                    this._changeLink(link, { relation: link.defaultRelation() });
                  }
                }
                return this.changeNodeOutsideUndoRedo(node, data);
              },
              undo: () => {
                this.changeNodeOutsideUndoRedo(node, originalData);
                if (accumulatorChanged) {
                  for (link of changedLinks) {
                    this._changeLink(link, { relation: originalRelations[link.key] });
                  }
                }
              }
            }
            );
            result.push(this.undoRedoManager.endCommandBatch());
          } else {
            result.push(undefined);
          }
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  },

  changeNodeOutsideUndoRedo(node, data, notifyCodap) {
    if (notifyCodap == null) { notifyCodap = true; }
    log.info(`Change for ${node.title}`);
    for (const key of Node.fields) {
      if (data.hasOwnProperty(key)) {
        log.info(`Change ${key} for ${node.title}`);
        const prev = node[key];
        node[key] = data[key];
        if (key === "title") {
          if (notifyCodap && this.usingCODAP) {
            const codapConnect = CodapConnect.instance(DEFAULT_CONTEXT_NAME);
            codapConnect.sendRenameAttribute(node.key, prev);
          }
          this._maybeChangeTransferTitle(node);
        }
      }
    }
    node.normalizeValues(_.keys(data));
    return this._notifyNodeChanged(node);
  },

  changeNodeProperty(property, value, node) {
    const data = {};
    data[property] = value;
    return this.changeNode(data, node);
  },

  changeNodeWithKey(key, data) {
    const node = this.nodeKeys[ key ];
    if (node) {
      return this.changeNode(data, node);
    }
  },

  nudgeNodeWithKeyInitialValue(key, delta) {
    const node = this.nodeKeys[ key ];
    if (node && !node.isTransfer) {
      const {initialValue, min, max} = node;
      const nudgeFactor = (max - min) / 1000;
      const newInitialValue = Math.max(min, Math.min(max, initialValue + (nudgeFactor * delta)));
      this.changeNodeProperty("initialValue", newInitialValue, node);
    }
  },

  startNodeEdit() {
    return this.undoRedoManager.startCommandBatch("changeNode");
  },

  endNodeEdit() {
    return this.undoRedoManager.endCommandBatch();
  },

  clickLink(link, multipleSelectionsAllowed) {
    // this is to allow both clicks and double clicks
    const now = (new Date()).getTime();
    const isDoubleClick = (now - (this.lastClickLinkTime || 0)) <= 250;
    this.lastClickLinkTime = now;
    clearTimeout(this.lastClickLinkTimeout);

    if (isDoubleClick) {
      this.selectionManager.selectNodeForInspection(link.targetNode);
      return InspectorPanelActions.openInspectorPanel("relations", {link});
    } else {
      // set single click handler to run 250ms from now so we can wait to see if this is a double click
      const singleClickHandler = () => {
        if (this.selectionManager.isSelected(link)) {
          return this.selectionManager.selectLinkForTitleEditing(link);
        } else {
          return this.selectionManager.selectLinkForInspection(link, multipleSelectionsAllowed);
        }
      };
      return this.lastClickLinkTimeout = setTimeout(singleClickHandler, 250);
    }
  },

  editLink(link) {
    return this.selectionManager.selectLinkForTitleEditing(link);
  },

  changeLink(link, changes) {
    if (changes == null) { changes = {}; }
    if (changes.deleted) {
      return this.removeSelectedLinks();
    } else if (link) {
      const originalData = {
        title: link.title,
        color: link.color,
        relation: link.relation,
        reasoning: link.reasoning
      };
      this.undoRedoManager.startCommandBatch();
      this.undoRedoManager.createAndExecuteCommand("changeLink", {
        execute: () => this._changeLink(link,  changes),
        undo: () => this._changeLink(link, originalData)
      }
      );
      return this.undoRedoManager.endCommandBatch();
    }
  },

  _maybeChangeSelectedItem(item) {
    // TODO: This is kind of hacky:
    if (this.selectionManager.isSelected(item)) {
      return this.selectionManager._notifySelectionChange();
    }
  },

  _maybeChangeRelation(link, relation) {
    if (relation && relation.isTransfer) {
      return this._addTransfer(link);
    } else {
      return this._removeTransfer(link);
    }
  },

  _maybeChangeTransferTitle(changedNode) {
    return (() => {
      const result: any = [];
      for (const key in this.nodeKeys) {
        const node = this.nodeKeys[key];
        const { transferLink } = node;
        if (transferLink && ((transferLink.sourceNode === changedNode) || (transferLink.targetNode === changedNode))) {
          result.push(this.changeNodeWithKey(key, {title: node.computeTitle()}));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  },

  _changeLink(link, changes) {
    log.info(`Change  for ${link.title}`);
    for (const key of ["title", "color", "relation", "reasoning"]) {
      if (changes[key] != null) {
        log.info(`Change ${key} for ${link.title}`);
        link[key] = changes[key];
      }
    }
    this._maybeChangeRelation(link, changes.relation);
    this._maybeChangeSelectedItem(link);
    this._graphUpdated();
    return this.updateListeners();
  },

  _nameForNode(node) {
    return this.nodeKeys[node];
  },

  newLinkFromEvent(info) {
    const newLink = {};
    const startKey = $(info.source).data("node-key") || "undefined";
    const endKey   = $(info.target).data("node-key") || "undefined";
    const startTerminal = info.connection.endpoints[0].anchor.type === "Top" ? "a" : "b";
    const endTerminal   = info.connection.endpoints[1].anchor.type === "Top" ? "a" : "b";
    this.importLink({
      sourceNode: startKey,
      targetNode: endKey,
      sourceTerminal: startTerminal,
      targetTerminal: endTerminal,
      color: info.color,
      title: info.title
    });
    return true;
  },

  deleteAll() {
    for (const node in this.nodeKeys) {
      this.removeNode(node);
    }
    GraphPrimitive.resetCounters();
    this.setFilename("New Model");
    return this.undoRedoManager.clearHistory();
  },

  removeSelectedNodes() {
    const selectedNodeKeys = this.selectedNodes().map((node) => node.key);
    return selectedNodeKeys.map((nodeKey) => this.removeNode(nodeKey));
  },

  removeSelectedLinks() {
    return this.selectedLinks().map((selectedLink) => this.removeLink(selectedLink));
  },

  deleteSelected() {
    log.info("Deleting selected items");
    // deleting multiple links/nodes should be undoable as a single action
    this.undoRedoManager.startCommandBatch();
    this.removeSelectedLinks();
    this.removeSelectedNodes();
    this.undoRedoManager.endCommandBatch();
    return this.selectionManager.clearSelection();
  },

  removeLinksForNode(node) {
    return node.links.map((link) => this.removeLink(link));
  },

  // getDescription returns one or more easily-comparable descriptions of the graph's
  // state, customized for different applications (e.g. deciding whether to redraw links),
  // while only looping through the nodes and links once.
  //
  // links: link terminal locations, and link formula (for stroke style), plus number of nodes
  //         e.g. "10,20;1 * in;50,60|" for each link
  // model: description of each link relationship and the values of its terminal nodes
  //         e.g. "node-0:50;1 * in;node-1:50|" for each link
  //
  // We pass nodes and links so as not to calculate @getNodes and @getLinks redundantly.
  getDescription(nodes, links) {
    const { settings } = SimulationStore;

    let linkDescription = "";
    let modelDescription = `steps:${settings.duration}|cap:${settings.capNodeValues}|`;

    _.each(links, (link) => {
      let source, target;
      if ((!(source = link.sourceNode)) || (!(target = link.targetNode))) { return; }
      linkDescription += `${source.x},${source.y};`;
      linkDescription += link.relation.formula + ";";
      linkDescription += `${target.x},${target.y}|`;
      if (link.relation.isDefined) {
        const isCappedNode = source.limitMinValue;
        const capValue = isCappedNode ? ":cap" : "";
        modelDescription += `${source.key}:${source.initialValue}${capValue};`;
        modelDescription += link.relation.formula + ";";
        if (link.relation.type === "transfer") {
          const transfer = link.transferNode;
          if (transfer) { modelDescription += `${transfer.key}:${transfer.initialValue}:${transfer.combineMethod};`; }
        }
        modelDescription += `${target.key}${target.isAccumulator ? `:${target.value != null ? target.value : target.initialValue}` : ""}`;
        return modelDescription += `;${target.combineMethod}|`;
      }
    });
    linkDescription += nodes.length;     // we need to redraw targets when new node is added

    return {
      links: linkDescription,
      model: modelDescription
    };
  },

  // Returns the minimum simulation type that the current graph allows.
  // Returns
  //   0 (diagramOnly)    if there are no defined relationships
  //   2 (time)           if there are collectors
  getMinimumSimulationType() {
    const nodes = this.getNodes();
    for (const node of nodes) {
      if (node.isAccumulator) {
        // we know we have to be time-based
        return AppSettingsStore.SimulationType.time;
      }
    }

    return AppSettingsStore.SimulationType.diagramOnly;
  },

  // Returns the minimum complexity that the current graph allows.
  // Returns
  //   0 (basic)          if there are no defined relationships, or all scalars are `about the same`
  //   1 (expanded)       otherwise
  getMinimumComplexity() {
    const links = this.getLinks();
    for (const link of links) {
      let source, target;
      if ((!(source = link.sourceNode)) || (!(target = link.targetNode))) { continue; }

      if (link.relation != null ? link.relation.formula : undefined) {
        const relation = RelationFactory.selectionsFromRelation(link.relation);
        if (relation.scalar && (relation.scalar.id !== "aboutTheSame")) {
          return AppSettingsStore.Complexity.expanded;
        }
      }
    }

    return AppSettingsStore.Complexity.basic;
  },

  loadData(data) {
    log.info("json success");
    const importer = new Importer(this, AppSettingsStore, PaletteStore);
    importer.importData(data);
    this.resetSimulation();
    return this.undoRedoManager.clearHistory();
  },

  loadDataFromUrl: url => {
    log.info("loading local data");
    log.info(`url ${url}`);
    return $.ajax({
      url,
      dataType: "json",
      success: data => {
        return this.loadData(data);
      },
      error(xhr, status, err) {
        return log.error(url, status, err.toString());
      }
    });
  },

  serializeGraph(palette) {
    let key;
    const nodeExports = (() => {
      const result: any = [];
      for (key in this.nodeKeys) {
        const node = this.nodeKeys[key];
        result.push(node.toExport());
      }
      return result;
    })();
    const linkExports = (() => {
      const result1: any = [];
      for (key in this.linkKeys) {
        const link = this.linkKeys[key];
        result1.push(link.toExport());
      }
      return result1;
    })();
    const settings = AppSettingsStore.serialize();
    settings.simulation = SimulationStore.serialize();
    const topology = getTopology({nodes: nodeExports, links: linkExports});
    const data = {
      version: latestVersion(),
      filename: this.filename,
      palette,
      nodes: nodeExports,
      links: linkExports,
      settings,
      topology
    };
    return data;
  },

  toJsonString(palette) {
    return JSON.stringify(this.serializeGraph(palette));
  },

  getGraphState(): GraphSettings {
    const nodes = this.getNodes();
    const links = this.getLinks();
    const description = this.getDescription(nodes, links);

    return {
      nodes,
      links,
      description
    };
  },

  updateListeners() {
    const graphState = this.getGraphState();
    GraphActions.graphChanged.trigger(graphState);

    if (this.lastRunModel !== graphState.description.model) {
      this._trimSimulation();
      SimulationActions.runSimulation();
      this.lastRunModel = graphState.description.model;
    }
  }
});

export interface GraphMixinProps {}

export type GraphMixinState = GraphSettings;

export class GraphMixin extends Mixin<GraphMixinProps, GraphMixinState> {
  private subscriptions: StoreUnsubscriber[];

  public componentDidMount() {
    this.subscriptions = [];
    this.subscriptions.push(GraphActions.graphChanged.listen(this.handleGraphChanged));
    return this.subscriptions.push(GraphActions.resetSimulation.listen(this.handleResetSimulation));
  }

  public componentWillUnmount() {
    return this.subscriptions.map((unsubscribe) => unsubscribe());
  }

  private handleGraphChanged = (state) => {
    this.setState(state);

    // this mixin is used by the GraphView and RelationInspector view but diagramToolkit
    // only exists in GraphView
    const diagramToolkit = (this.mixer as GraphView).diagramToolkit;
    if (diagramToolkit) {
      diagramToolkit.repaint();
    }
  }

  private handleResetSimulation = () => {
    return GraphStore.resetSimulation();
  }
}

GraphMixin.InitialState = () => GraphStore.getGraphState();

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
