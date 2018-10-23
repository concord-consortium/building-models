/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const Node = require("./node");
import { tr } from "../utils/translate";

const DEFAULT_COMBINE_METHOD = "product";

class Transfer extends Node {
  private type = "Transfer";
  private isTransfer = true;
  private combineMethod = DEFAULT_COMBINE_METHOD;

  public setTransferLink(link) {
    this.transferLink = link;
    return this.title = this.computeTitle();
  }

  public computeTitle() {
    if (this.transferLink) {
      return tr("~TRANSFER_NODE.TITLE", { sourceTitle: this.transferLink.sourceNode.title,
        targetTitle: this.transferLink.targetNode.title });
    } else {
      return undefined;
    }
  }
}

module.exports = Transfer;
