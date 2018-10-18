/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {div, h2, label, input, select, option, optgroup, button, i} = React.DOM;
const tr = require("../utils/translate");
const ColorPicker = React.createFactory(require('./color-picker-view'));
const ImagePickerView = React.createFactory(require('./image-picker-view'));
module.exports = React.createClass({

  displayName: 'NodeInspectorView',
  mixins: [require("../mixins/node-title")],
  changeTitle(e) {
    const newTitle = this.cleanupTitle(e.target.value);
    return (typeof this.props.onNodeChanged === 'function' ? this.props.onNodeChanged(this.props.node, {title: newTitle}) : undefined);
  },

  changeImage(node) {
    return (typeof this.props.onNodeChanged === 'function' ? this.props.onNodeChanged(this.props.node, {image: node.image, paletteItem: node.uuid}) : undefined);
  },

  changeColor(color) {
    return (typeof this.props.onNodeChanged === 'function' ? this.props.onNodeChanged(this.props.node, {color}) : undefined);
  },

  delete(e) {
    return (typeof this.props.onNodeDelete === 'function' ? this.props.onNodeDelete(this.props.node) : undefined);
  },

  render() {
    const builtInNodes = [];
    const droppedNodes = [];
    const remoteNodes = [];
    const tabs = [tr('design'), tr('define')];
    const selected = tr('design');
    const displayTitle = this.displayTitleForInput(this.props.node.title);

    return (div({className: 'node-inspector-view'},
      // previous design comps:
      // (InspectorTabs {tabs: tabs, selected: selected} )
      (div({className: 'inspector-content'},
        (() => {
        if (!this.props.node.isTransfer) {
          div({className: 'edit-row'},
            (label({htmlFor: 'title'}, tr("~NODE-EDIT.TITLE"))),
            (input({type: 'text', name: 'title', value: displayTitle, placeholder: this.titlePlaceholder(),  onChange: this.changeTitle}))
          );
          div({className: 'edit-row'},
            (label({htmlFor: 'color'}, tr("~NODE-EDIT.COLOR"))),
            (ColorPicker({selected: this.props.node.color,  onChange: this.changeColor}))
          );
          return (div({className: 'edit-row'},
            (label({htmlFor: 'image'}, tr("~NODE-EDIT.IMAGE"))),
            (ImagePickerView({selected: this.props.node, onChange: this.changeImage}))
          ));
        }
      })(),
        (div({className: 'edit-row'},
          (label({className: 'node-delete', onClick: this.delete},
            (i({className: "icon-codap-trash"})),
            tr("~NODE-EDIT.DELETE")
          ))
        ))
      ))
    ));
  }
});
