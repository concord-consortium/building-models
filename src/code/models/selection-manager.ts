/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");
const log = require("loglevel");

export class SelectionManager {

  public static NodeTitleEditing;
  public static NodeInspection;
  public static LinkTitleEditing;
  public static LinkInspection;

  public static initialize() {
    SelectionManager.NodeTitleEditing   = "NodeTitleEditing";
    SelectionManager.NodeInspection     = "NodeInspection";
    SelectionManager.LinkTitleEditing   = "LinkTitleEditing";
    SelectionManager.LinkInspection     = "LinkInspection";
  }

  private selections: any[];
  private selectionListeners: any[];

  constructor() {
    this.selections = [];
    this.selectionListeners = [];
  }

  public addSelectionListener(listener) {
    log.info(`adding selection listener ${listener}`);
    return this.selectionListeners.push(listener);
  }


  public _notifySelectionChange() {
    log.info("notifiying listeners");
    return this.selectionListeners.map((listener) =>
      listener(this));
  }

  public addToSelection(graphprimitive, context) {
    const entry = {graphprimitive, context, key: graphprimitive.key};
    if (!this.isSelected(graphprimitive, context)) {
      return this.selections.push(entry);
    }
  }

  public selectOnly(graphprimitive, context, multipleSelectionsAllowed?) {
    if (!this.isSelected(graphprimitive, context)) {
      if (!multipleSelectionsAllowed) { this._clearSelection(context); }
      return this.addToSelection(graphprimitive, context);
    }
  }

  public selection(context) {
    const where: any = {};
    if (context) { where.context = context; }
    return _.chain(this.selections)
      .where(where)
      .map(obj => obj.graphprimitive).value();
  }

  public _clearSelection(context?) {
    // deselects without notifying about the change
    // this should be paired with a call to this._notifySelectionChange() when doing multiple selection operations
    this._deselect({context});
  }

  public clearSelection(context?) {
    this._clearSelection(context);
    return this._notifySelectionChange();
  }

  public clearLinkInspection() {
    return this.clearSelection(SelectionManager.LinkInspection);
  }

  public clearSelectionFor(graphprimitive, context?) {
    return this._deselect({key: graphprimitive.key, context});
  }

  public isSelected(graphprimitive, context?) {
    const where: any = {key: graphprimitive.key};
    if (context) { where.context = context; }
    const found = _.chain(this.selections)
      .where(where)
      .value();
    return found.length > 0;
  }

  public selectNodeForTitleEditing(graphprimitive) {
    this._selectForTitleEditing(graphprimitive, SelectionManager.NodeTitleEditing);
    this._clearSelection(SelectionManager.LinkTitleEditing);
    return this._notifySelectionChange();
  }

  public selectLinkForTitleEditing(graphprimitive) {
    this._selectForTitleEditing(graphprimitive, SelectionManager.LinkTitleEditing);
    this._clearSelection(SelectionManager.NodeTitleEditing);
    return this._notifySelectionChange();
  }

  public _selectForTitleEditing(graphprimitive, context) {
    this.selectOnly(graphprimitive, context);
    // unselect the inspection selection, unless its this same graphprimitive.
    if (!this.isSelectedForInspection(graphprimitive)) {
      return this.clearInspection();
    }
  }

  public clearInspection() {
    this.clearNodeInspection();
    return this.clearLinkInspection();
  }

  public clearTitleEditing() {
    this._clearSelection(SelectionManager.NodeTitleEditing);
    this._clearSelection(SelectionManager.LinkTitleEditing);
    this._notifySelectionChange();
  }

  public isSelectedForTitleEditing(graphprimitive) {
    return this.isSelected(graphprimitive, SelectionManager.NodeTitleEditing) ||
      this.isSelected(graphprimitive, SelectionManager.LinkTitleEditing);
  }

  public getNodeTitleEditing() {
    return this.selection(SelectionManager.NodeTitleEditing);
  }

  public selectNodeForInspection(graphprimitive, multipleSelectionsAllowed) {
    // when clicking with eg. ctrl key, multipleSelectionsAllowed is true, so we dont unselect other nodes.
    this.selectOnly(graphprimitive, SelectionManager.NodeInspection, multipleSelectionsAllowed);
    if (!multipleSelectionsAllowed) { this.clearLinkInspection(); }

    // unselect the title selection, unless its this same graphprimitive.
    if (!this.isSelectedForTitleEditing(graphprimitive)) {
      this.clearTitleEditing();
    }

    return this._notifySelectionChange();
  }

  public clearNodeInspection() {
    return this.clearSelection(SelectionManager.NodeInspection);
  }

  public isSelectedForInspection(graphprimitive) {
    return this.isSelected(graphprimitive, SelectionManager.NodeInspection) ||
      this.isSelected(graphprimitive, SelectionManager.LinkInspection);
  }

  public getNodeInspection() {
    return this.selection(SelectionManager.NodeInspection);
  }

  public getLinkInspection() {
    return this.selection(SelectionManager.LinkInspection);
  }

  public getLinkTitleEditing() {
    return this.selection(SelectionManager.LinkTitleEditing);
  }

  public selectLinkForInspection(graphprimitive, multipleSelectionsAllowed) {
    this.selectOnly(graphprimitive, SelectionManager.LinkInspection, multipleSelectionsAllowed);
    if (!multipleSelectionsAllowed) { this.clearNodeInspection(); }

    // unselect the title selection, unless its this same graphprimitive.
    if (!this.isSelectedForTitleEditing(graphprimitive)) {
      this.clearTitleEditing();
    }

    return this._notifySelectionChange();
  }

  public _deselect(opts) {
    const pickNonEmpty    = _.partial(_.pick, _, _.identity);
    const removeCritereon = pickNonEmpty(opts);
    log.info(removeCritereon);
    if (removeCritereon.context || removeCritereon.key) {
      log.info(`removing ${removeCritereon.key}`);
      log.info(`in collection ${_.pluck(this.selections, "key")}`);
      _.remove(this.selections, removeCritereon);
      return log.info(`in collection ${_.pluck(this.selections, "key")}`);
    } else {
      return this.selections = [];
    }
  }
}

SelectionManager.initialize();
