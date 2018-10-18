/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const tr = require("../utils/translate");

module.exports = {
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
