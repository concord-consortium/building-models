/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const ModalDialog         = React.createFactory(require("./modal-dialog-view"));
const PaletteDeleteView   = React.createFactory(require("./palette-delete-view"));
const PaletteDialogStore  = require("../stores/palette-delete-dialog-store");
const NodesStore          = require("../stores/nodes-store");
const tr                  = require("../utils/translate");

const {div, ul, li, a} = React.DOM;

module.exports = React.createClass({

  displayName: "ModalPaletteDelete",
  mixins: [PaletteDialogStore.mixin],

  render() {
    return (div({key: "ModalPaletteDelete"},
      (() => {
        if (this.state.showing) {
          const title = tr("~PALETTE-DIALOG.TITLE");
          return (ModalDialog({title, close: PaletteDialogStore.actions.close },
            (PaletteDeleteView({
              options: this.state.options,
              paletteItem: this.state.paletteItem,
              replacement: this.state.replacement,
              showReplacement: this.state.showReplacement,
              cancel: PaletteDialogStore.actions.close,
              ok: () => PaletteDialogStore.actions.delete(this.state.paletteItem)
            }))
          ));
        }
      })()
    ));
  }
});
