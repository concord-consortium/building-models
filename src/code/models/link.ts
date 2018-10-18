/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Link;
const GraphPrimitive = require("./graph-primitive");
const Relation       = require("./relationship");
const LinkColors     = require("../utils/link-colors");

module.exports = (Link = (function() {
  Link = class Link extends GraphPrimitive {
    static initClass() {
  
      this.defaultColor = LinkColors.default;
      this.defaultRelation = new Relation({
        formula: "1 * in"});
  
      this.prototype.type = "Link";
    }

    constructor(options) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf("return") + 6 + 1, thisFn.indexOf(";")).trim();
        eval(`${thisName} = this;`);
      }
      if (options == null) { options = {}; }
      this.options = options;
      if (this.options.color == null) { this.options.color = Link.defaultColor; }
      if (this.options.title == null) { this.options.title = ""; }

      ({
        sourceNode: this.sourceNode, sourceTerminal: this.sourceTerminal, targetNode: this.targetNode, targetTerminal: this.targetTerminal,
        color: this.color, title: this.title
      } = this.options);
      if (this.options.transferNode) {
        this.transferNode = this.options.transferNode;
        this.transferNode.setTransferLink(this);
      }
      this.relation = this._makeRelation(this.options.relation);
      this.reasoning = this.options.reasoning || "";
      this.jsPlumbConnection = null; // place to keep underlaying connection
      super();
    }

    _makeRelation(relationObj) {
      let relation;
      if (!(relationObj instanceof Relation)) {
        relation = new Relation((relationObj || {}));
      } else {
        relation = relationObj;
      }
      return relation;
    }

    defaultRelation() {
      return new Relation({});
    }

    terminalKey() {
      return `${this.sourceNode.key} ------> ${this.targetNode.key}`;
    }

    nodeKey() {
      return `${this.sourceNode} ---${this.key}---> ${this.targetNode}`;
    }

    outs() {
      return [this.targetNode];
    }

    ins() {
      return [this.sourceNode];
    }

    toExport() {
      const link = {
        "title": this.title,
        "color": this.color,
        "sourceNode": this.sourceNode.key,
        "sourceTerminal": this.sourceTerminal,
        "targetNode": this.targetNode.key,
        "targetTerminal": this.targetTerminal,
        "relation": this.relation.toExport(),
        "reasoning": this.reasoning
      };
      if (this.transferNode) { link.transferNode = this.transferNode.key; }
      return link;
    }
  };
  Link.initClass();
  return Link;
})());
