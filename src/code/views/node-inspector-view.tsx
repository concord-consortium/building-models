/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const tr = require("../utils/translate");

import {ColorPickerView} from "./color-picker-view";
const ImagePickerView = require("./image-picker-view");

module.exports = React.createClass({

  displayName: "NodeInspectorView",

  mixins: [require("../mixins/node-title")],

  changeTitle(e) {
    const newTitle = this.cleanupTitle(e.target.value);
    return (typeof this.props.onNodeChanged === "function" ? this.props.onNodeChanged(this.props.node, {title: newTitle}) : undefined);
  },

  changeImage(node) {
    return (typeof this.props.onNodeChanged === "function" ? this.props.onNodeChanged(this.props.node, {image: node.image, paletteItem: node.uuid}) : undefined);
  },

  changeColor(color) {
    return (typeof this.props.onNodeChanged === "function" ? this.props.onNodeChanged(this.props.node, {color}) : undefined);
  },

  delete(e) {
    return (typeof this.props.onNodeDelete === "function" ? this.props.onNodeDelete(this.props.node) : undefined);
  },

  renderForm() {
    const displayTitle = this.displayTitleForInput(this.props.node.title);
    return (
      <div>
        <div className="edit-row">
          <label htmlFor="title">{tr("~NODE-EDIT.TITLE")}</label>
          <input type="text" name="title" value={displayTitle} placeholder={this.titlePlaceholder()} onChange={this.changeTitle} />
        </div>
        <div className="edit-row">
          <label htmlFor="color">{tr("~NODE-EDIT.COLOR")}</label>
          <ColorPickerView selected={this.props.node.color} onChange={this.changeColor} />
        </div>
        <div className="edit-row">
          <label htmlFor="image">{tr("~NODE-EDIT.IMAGE")}</label>
          <ImagePickerView selected={this.props.node} onChange={this.changeImage} />
        </div>
      </div>
    );
  },

  render() {
    return (
      <div className="node-inspector-view">
        <div className="inspector-content">
          {!this.props.node.isTransfer ? this.renderForm() : undefined}
          <div className="edit-row">
            <label className="node-delete" onClick={this.delete}>
              <i className="icon-codap-trash" />
              {tr("~NODE-EDIT.DELETE")}
            </label>
          </div>
        </div>
      </div>
    );
  }
});
