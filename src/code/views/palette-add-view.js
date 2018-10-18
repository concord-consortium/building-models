/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ImageDialogStore   = require("../stores/image-dialog-store");
const Draggable          = require('../mixins/draggable');
const tr                 = require("../utils/translate");

const {div} = React.DOM;

module.exports = React.createClass({

  displayName: 'PaletteAddView',
  mixins: [Draggable],
  getDefaultProps() {
    return {
      callback: false,
      label: tr('~PALETTE-INSPECTOR.ADD_IMAGE')
    };
  },

  render() {
    return (div({className: 'palette-image', 'data-droptype': 'new'},
      (div({
        className: 'palette-add-image',
        onClick: () => ImageDialogStore.actions.open.trigger(this.props.callback)
        },
        this.props.label ))
    ));
  }
});
