/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { GraphPrimitive } from "./graph-primitive";
import { Relationship } from "./relationship";
import { LinkColors } from "../utils/link-colors";
import { TransferModel } from "./transfer";
import { Node } from "./node";

export class Link extends GraphPrimitive {
  public static defaultColor;
  public static defaultRelation;

  public static initialize() {
    Link.defaultColor = LinkColors.default;
    Link.defaultRelation = new Relationship({formula: "1 * in"});
  }

  public transferNode: TransferModel;
  public relation: Relationship;

  public reasoning: string;
  public sourceNode: Node; // TODO: get concrete type
  public targetNode: Node | TransferModel;

  public readonly title: string;

  private options: any; // TODO: get concrete type
  private sourceTerminal: any; // TODO: get concrete type
  private targetTerminal: any; // TODO: get concrete type
  private color: string;
  private jsPlumbConnection: any; // TODO: get concrete type

  constructor(options) {
    super("Link");

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

  public _makeRelation(relationObj) {
    let relation;
    if (!(relationObj instanceof Relationship)) {
      relation = new Relationship((relationObj || {}));
    } else {
      relation = relationObj;
    }
    return relation;
  }

  public defaultRelation() {
    return new Relationship({});
  }

  public terminalKey() {
    return `${this.sourceNode.key} ------> ${this.targetNode.key}`;
  }

  public nodeKey() {
    return `${this.sourceNode} ---${this.key}---> ${this.targetNode}`;
  }

  public outs() {
    return [this.targetNode];
  }

  public ins() {
    return [this.sourceNode];
  }

  public toExport() {
    const link: any = {  // checked: any ok
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
