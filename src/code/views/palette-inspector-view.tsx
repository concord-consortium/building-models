const _ = require("lodash");
import * as React from "react";

import { PaletteItemView } from "./palette-item-view";
import { PaletteAddView } from "./palette-add-view";
import { ImageMetadataView } from "./image-metadata-view";

import { PaletteActions, PaletteStore, isFixedPaletteItem } from "../stores/palette-store";
import { PaletteDeleteDialogActions } from "../stores/palette-delete-dialog-store";
import { NodesMixin, NodesMixinProps, NodesMixinState } from "../stores/nodes-store";

import { tr } from "../utils/translate";

import { PaletteMixinProps, PaletteMixinState, PaletteMixin } from "../stores/palette-store";
import { AppSettingsStore, AppSettingsMixin, AppSettingsMixinProps, AppSettingsMixinState } from "../stores/app-settings-store";
import { Mixer } from "../mixins/components";

interface PaletteInspectorViewOuterProps {
  hideSelectedInspector?: boolean;
}

type PaletteInspectorViewProps = PaletteInspectorViewOuterProps & PaletteMixinProps & NodesMixinProps & AppSettingsMixinProps;

interface PaletteInspectorViewOuterState {
}
type PaletteInspectorViewState = PaletteInspectorViewOuterState & PaletteMixinState & NodesMixinState & AppSettingsMixinState;

export class PaletteInspectorView extends Mixer<PaletteInspectorViewProps, PaletteInspectorViewState> {

  public static displayName = "PaletteInspectorView";

  private palette: HTMLDivElement | null;

  constructor(props: PaletteInspectorViewProps) {
    super(props);
    this.mixins = [new PaletteMixin(this), new NodesMixin(this), new AppSettingsMixin(this)];
    const outerState: PaletteInspectorViewOuterState = {
    };
    this.setInitialState(outerState, PaletteMixin.InitialState(), NodesMixin.InitialState(), AppSettingsMixin.InitialState());
  }

  public render() {
    return (
      <div className="palette-inspector">
        <div className="palette" ref={el => this.palette = el}>
          <div>
            <PaletteAddView label={tr("~PALETTE-INSPECTOR.ADD_IMAGE")} />
            {_.map(PaletteStore.orderedPalette(this.state.simulationType), (node, index) => {
              return <PaletteItemView
                key={node.uuid}
                node={node}
                image={node.image}
                // selected={index === this.state.selectedPaletteIndex}
                onSelect={this.handleImageSelected}
              />;
            })}
          </div>
        </div>
        {this.state.selectedPaletteItem && (!this.props.hideSelectedInspector) ?
          <div className="palette-about-image">
            <div className="palette-about-image-info">
              {this.state.selectedPaletteItem.metadata
                ? <ImageMetadataView small={true} metadata={this.state.selectedPaletteItem.metadata} update={PaletteActions.update} />
                : undefined}
              {!isFixedPaletteItem(this.state.selectedPaletteItem) ?
              <div className="palette-delete" onClick={this.handleDelete}>
                {this.state.paletteItemHasNodes ?
                  <span>
                    <i className="icon-codap-swapAxis" />
                    <label>{tr("~PALETTE-INSPECTOR.REPLACE")}</label>
                  </span>
                  :
                  <span>
                    <i className="icon-codap-trash" />
                    <label>{tr("~PALETTE-INSPECTOR.DELETE")}</label>
                  </span>}
              </div> : undefined}
            </div>
            <div className="palette-about-image-title">
              <img src={this.state.selectedPaletteImage} />
            </div>
          </div> : undefined}
      </div>
    );
  }

  private handleImageSelected = (uuid: string) => {
    const item = PaletteStore.findByUUID(uuid);
    if (item) {
      const index = PaletteStore.palette.indexOf(item);
      PaletteActions.selectPaletteIndex(index);
    }
  }

  private handleDelete = () => {
    PaletteDeleteDialogActions.open();
  }

}
