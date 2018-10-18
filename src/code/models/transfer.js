/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Transfer;
const Node = require('./node');
const tr = require("../utils/translate");

const DEFAULT_COMBINE_METHOD='product';

module.exports = (Transfer = (function() {
  Transfer = class Transfer extends Node {
    static initClass() {
  
      this.prototype.type = 'Transfer';
      this.prototype.isTransfer = true;
      this.prototype.combineMethod = DEFAULT_COMBINE_METHOD;
    }

    setTransferLink(link) {
      this.transferLink = link;
      return this.title = this.computeTitle();
    }

    computeTitle() {
      if (this.transferLink) {
        return tr('~TRANSFER_NODE.TITLE', { sourceTitle: this.transferLink.sourceNode.title, 
                                      targetTitle: this.transferLink.targetNode.title });
      } else {
        return undefined;
      }
    }
  };
  Transfer.initClass();
  return Transfer;
})());