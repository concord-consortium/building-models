import { ModalDialogView } from "./modal-dialog-view";
import { PaletteDeleteView } from "./palette-delete-view";
import { PaletteDeleteDialogActions, PaletteDeleteDialogMixin } from "../stores/palette-delete-dialog-store";
import { tr } from "../utils/translate";

export const ModalPaletteDeleteView = React.createClass({

  displayName: "ModalPaletteDeleteView",

  mixins: [PaletteDeleteDialogMixin],

  deleteItem() {
    PaletteDeleteDialogActions.delete(this.state.paletteItem);
  },

  renderShowing() {
    const title = tr("~PALETTE-DIALOG.TITLE");
    return (
      <ModalDialogView title={title} close={PaletteDeleteDialogActions.close}>
        <PaletteDeleteView
          paletteItem={this.state.paletteItem}
          replacement={this.state.replacement}
          showReplacement={this.state.showReplacement}
          cancel={PaletteDeleteDialogActions.close}
          ok={this.deleteItem}
        />
      </ModalDialogView>
    );
  },

  render() {
    return (
      <div key="ModalPaletteDelete">
        {this.state.showing ? this.renderShowing() : undefined}
      </div>
    );
  }
});
