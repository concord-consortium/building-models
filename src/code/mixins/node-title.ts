/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");

import { tr } from "../utils/translate";
import { Mixin } from "./components";

export const NodeTitleMixin = {
  defaultTitle() {
    return tr("~NODE.UNTITLED");
  },

  titlePlaceholder() {
    return this.defaultTitle();
  },

  isDefaultTitle() {
    return this.props.title === this.titlePlaceholder();
  },

  displayTitleForInput(proposedTitle) {
    // For input fields, use 'placeholder' value @defaultTitle
    // to work, the 'value' attribute of the input should be blank
    if (proposedTitle === this.defaultTitle()) { return ""; } else { return proposedTitle; }
  },

  maxTitleLength() {
    return 35;
  },

  cleanupTitle(newTitle, isComplete) {
    let cleanTitle = isComplete ? _.trim(newTitle) : newTitle;
    cleanTitle = cleanTitle.substr(0, this.maxTitleLength());
    cleanTitle = isComplete ? _.trim(cleanTitle) : cleanTitle;
    return cleanTitle = cleanTitle.length > 0 ? cleanTitle : this.defaultTitle();
  }
};

export interface NodeTitleMixin2Props {
  title: string;
}
export interface NodeTitleMixin2State {}

export class NodeTitleMixin2 extends Mixin<NodeTitleMixin2Props, NodeTitleMixin2State> {

  public defaultTitle() {
    return tr("~NODE.UNTITLED");
  }

  public titlePlaceholder() {
    return this.defaultTitle();
  }

  public isDefaultTitle() {
    return this.props.title === this.titlePlaceholder();
  }

  public displayTitleForInput(proposedTitle) {
    // For input fields, use 'placeholder' value @defaultTitle
    // to work, the 'value' attribute of the input should be blank
    if (proposedTitle === this.defaultTitle()) { return ""; } else { return proposedTitle; }
  }

  public maxTitleLength() {
    return 35;
  }

  public cleanupTitle(newTitle, isComplete?) {
    let cleanTitle = isComplete ? _.trim(newTitle) : newTitle;
    cleanTitle = cleanTitle.substr(0, this.maxTitleLength());
    cleanTitle = isComplete ? _.trim(cleanTitle) : cleanTitle;
    return cleanTitle = cleanTitle.length > 0 ? cleanTitle : this.defaultTitle();
  }
}

NodeTitleMixin2.InitialState = {};

