/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const GraphPrimitive = require("./graph-primitive");
const Relation       = require("./relationship");
const LinkColors     = require("../utils/link-colors");

class Link extends GraphPrimitive {
  static defaultColor;
  static defaultRelation;

  public transferNode: any;

  static initialize() {
    Link.defaultColor = LinkColors.default;
    Link.defaultRelation = new Relation({formula: "1 * in"});
  }

  constructor(options) {
    super();

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
    const link:any = {
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
}

Link.initialize();

module.exports = Link;
