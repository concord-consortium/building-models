import * as React from "react";
const log = require("loglevel");

import { ModalDialogView } from "./modal-dialog-view";
import { PaletteDeleteView } from "./palette-delete-view";
import { PaletteDeleteDialogActions, PaletteDeleteDialogMixinProps, PaletteDeleteDialogMixinState, PaletteDeleteDialogMixin } from "../stores/palette-delete-dialog-store";
import { tr } from "../utils/translate";
import { Mixer } from "../mixins/components";


interface ModalPaletteDeleteViewOuterProps {}
type ModalPaletteDeleteViewProps = ModalPaletteDeleteViewOuterProps & PaletteDeleteDialogMixinProps;

interface ModalPaletteDeleteViewOuterState {
}
type ModalPaletteDeleteViewState = ModalPaletteDeleteViewOuterState & PaletteDeleteDialogMixinState;

export class ModalPaletteDeleteView extends Mixer<ModalPaletteDeleteViewProps, ModalPaletteDeleteViewState> {

  public static displayName = "ModalPaletteDeleteView";

  constructor(props: ModalPaletteDeleteViewProps) {
    super(props);
    this.mixins = [new PaletteDeleteDialogMixin(this)];
    const outerState: ModalPaletteDeleteViewOuterState = {
    };
    this.setInitialState(outerState, PaletteDeleteDialogMixin.InitialState());
  }

  public render() {
    return (
      <div key="ModalPaletteDelete">
        {this.state.showing ? this.renderShowing() : undefined}
      </div>
    );
  }

  private renderShowing() {
    const title = tr("~PALETTE-DIALOG.TITLE");
    return (
      <ModalDialogView title={title} close={PaletteDeleteDialogActions.close}>
        <PaletteDeleteView
          paletteItem={this.state.paletteItem}
          replacement={this.state.replacement}
          showReplacement={this.state.showReplacement}
          cancel={PaletteDeleteDialogActions.close}
          ok={this.handleDeleteItem}
        />
      </ModalDialogView>
    );
  }

  private handleDeleteItem = () => {
    PaletteDeleteDialogActions.delete(this.state.paletteItem);
  }
}
