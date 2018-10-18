/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const tr = require("../utils/translate");
const PaletteDialogStore = require("../stores/palette-delete-dialog-store");
const ImagePickerView = React.createFactory(require("./image-picker-view"));

const {div, span, i, img, button, a} = React.DOM;

module.exports = React.createClass({

  displayName: "PaletteDeleteView",
  changePalette(args) {
    return PaletteDialogStore.actions.select(args);
  },

  cancel() {
    return (typeof this.props.cancel === "function" ? this.props.cancel() : undefined);
  },

  ok() {
    return (typeof this.props.ok === "function" ? this.props.ok() : undefined);
  },


  renderArrow() {
    if (this.props.showReplacement) {
      return (div({className: "vertical-content"},
        (i({className: "arrow-div icon-codap-right-arrow"}))
      ));
    }
  },

  renderReplacement() {
    if (this.props.showReplacement) {
      return (div({className: "vertical-content"},
        (div({className: "label"}, tr("~PALETTE-DIALOG.REPLACE"))),
        (ImagePickerView({
          selected: this.props.replacement,
          onChange: this.changePalette
        }))
      ));
    }
  },

  renderPaletteItem() {
    const oldImage   = this.props.paletteItem != null ? this.props.paletteItem.image : undefined;
    return (div({className: "vertical-content"},
      (div({className: "label"}, tr("~PALETTE-DIALOG.DELETE"))),
      oldImage ?
        (img({src: oldImage})) : undefined
    ));
  },

  renderButtons() {
    return (div({className: "vertical-content buttons"},
      (div({},
        (button({className: "button ok", onClick: this.ok}, tr("~PALETTE-DIALOG.OK")))
      )),
      (div({className: "cancel"},
        (a({onClick: this.cancel}, tr("~PALETTE-DIALOG.CANCEL")))
      ))
    ));
  },

  render() {
    return (div({className: "palette-delete-view"},
      (div({className: "horizontal-content"},
        this.renderPaletteItem(),
        this.renderArrow(),
        this.renderReplacement(),
        this.renderButtons()
      ))
    ));
  }
});
