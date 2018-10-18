/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SelectionManager;
const Importer    = require("../utils/importer");
const Link        = require("./link");
const DiagramNode = require("./node");
const tr          = require("../utils/translate");


module.exports = (SelectionManager = (function() {
  SelectionManager = class SelectionManager {
    static initClass() {
      this.NodeTitleEditing   = "NodeTitleEditing";
      this.NodeInspection     = "NodeInspection";
      this.LinkTitleEditing   = "LinkTitleEditing";
      this.LinkInspection     = "LinkInspection";
    }

    constructor() {
      this.selections = [];
      this.selectionListeners = [];
    }

    addSelectionListener(listener) {
      log.info(`adding selection listener ${listener}`);
      return this.selectionListeners.push(listener);
    }


    _notifySelectionChange() {
      log.info("notifiying listeners");
      return Array.from(this.selectionListeners).map((listener) =>
        listener(this));
    }

    addToSelection(graphprimitive, context) {
      const entry = {graphprimitive, context, key: graphprimitive.key};
      if (!this.isSelected(graphprimitive, context)) {
        return this.selections.push(entry);
      }
    }

    selectOnly(graphprimitive, context, multipleSelectionsAllowed) {
      if (!this.isSelected(graphprimitive, context)) {
        if (!multipleSelectionsAllowed) { this._clearSelection(context); }
        return this.addToSelection(graphprimitive, context);
      }
    }

    selection(context) {
      const where = {};
      if (context) { where.context = context; }
      return _.chain(this.selections)
        .where(where)
        .map(obj => obj.graphprimitive).value();
    }

    _clearSelection(context=null) {
      this._deselect({context});
      return this._notifySelectionChange();
    }

    clearSelection(context=null) {
      this._clearSelection(context);
      return this._notifySelectionChange();
    }

    clearLinkInspection() {
      return this._clearSelection(SelectionManager.LinkInspection);
    }

    clearSelectionFor(graphprimitive, context=null) {
      return this._deselect({key:graphprimitive.key, context});
    }

    isSelected(graphprimitive, context) {
      const where = {key: graphprimitive.key};
      if (context) { where.context = context; }
      const found = _.chain(this.selections)
        .where(where)
        .value();
      return found.length > 0;
    }

    selectNodeForTitleEditing(graphprimitive) {
      this._selectForTitleEditing(graphprimitive, SelectionManager.NodeTitleEditing);
      this._clearSelection(SelectionManager.LinkTitleEditing);
      return this._notifySelectionChange();
    }

    selectLinkForTitleEditing(graphprimitive) {
      this._selectForTitleEditing(graphprimitive, SelectionManager.LinkTitleEditing);
      this._clearSelection(SelectionManager.NodeTitleEditing);
      return this._notifySelectionChange();
    }

    _selectForTitleEditing(graphprimitive, context) {
      this.selectOnly(graphprimitive, context);
      // unselect the inspection selection, unless its this same graphprimitive.
      if (!this.isSelectedForInspection(graphprimitive)) {
        return this.clearInspection();
      }
    }

    clearInspection() {
      this.clearNodeInspection();
      return this.clearLinkInspection();
    }

    clearTitleEditing() {
      this._clearSelection(SelectionManager.NodeTitleEditing);
      return this._clearSelection(SelectionManager.LinkTitleEditing);
    }

    isSelectedForTitleEditing(graphprimitive){
      return this.isSelected(graphprimitive,SelectionManager.NodeTitleEditing) ||
        this.isSelected(graphprimitive,SelectionManager.LinkTitleEditing);
    }

    getNodeTitleEditing() {
      return this.selection(SelectionManager.NodeTitleEditing);
    }

    selectNodeForInspection(graphprimitive, multipleSelectionsAllowed) {
      // when clicking with eg. ctrl key, multipleSelectionsAllowed is true, so we dont unselect other nodes.
      this.selectOnly(graphprimitive, SelectionManager.NodeInspection, multipleSelectionsAllowed);
      if (!multipleSelectionsAllowed) { this.clearLinkInspection(); }

      // unselect the title selection, unless its this same graphprimitive.
      if (!this.isSelectedForTitleEditing(graphprimitive)) {
        this.clearTitleEditing();
      }

      return this._notifySelectionChange();
    }

    clearNodeInspection() {
      return this._clearSelection(SelectionManager.NodeInspection);
    }

    isSelectedForInspection(graphprimitive) {
      return this.isSelected(graphprimitive,SelectionManager.NodeInspection) ||
        this.isSelected(graphprimitive,SelectionManager.LinkInspection);
    }

    getNodeInspection() {
      return this.selection(SelectionManager.NodeInspection);
    }

    getLinkInspection() {
      return this.selection(SelectionManager.LinkInspection);
    }

    getLinkTitleEditing() {
      return this.selection(SelectionManager.LinkTitleEditing);
    }

    selectLinkForInspection(graphprimitive, multipleSelectionsAllowed){
      this.selectOnly(graphprimitive, SelectionManager.LinkInspection, multipleSelectionsAllowed);
      if (!multipleSelectionsAllowed) { this.clearNodeInspection(); }

      // unselect the title selection, unless its this same graphprimitive.
      if (!this.isSelectedForTitleEditing(graphprimitive)) {
        this.clearTitleEditing();
      }

      return this._notifySelectionChange();
    }

    _deselect(opts){
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
  };
  SelectionManager.initClass();
  return SelectionManager;
})());
