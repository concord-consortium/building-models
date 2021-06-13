const _ = require("lodash");
import * as React from "react";

import { PaletteItemView } from "./palette-item-view";
import { PaletteAddView } from "./palette-add-view";
import { ImageMetadataView } from "./image-metadata-view";

import { PaletteActions, PalleteItem, PaletteStore } from "../stores/palette-store";
import { PaletteDeleteDialogActions } from "../stores/palette-delete-dialog-store";
import { NodesMixin, NodesMixinProps, NodesMixinState } from "../stores/nodes-store";

import { tr } from "../utils/translate";

import { PaletteMixinProps, PaletteMixinState, PaletteMixin } from "../stores/palette-store";
import { Mixer } from "../mixins/components";

interface PaletteInspectorViewOuterProps {}
type PaletteInspectorViewProps = PaletteInspectorViewOuterProps & PaletteMixinProps & NodesMixinProps;

interface PaletteInspectorViewOuterState {
}
type PaletteInspectorViewState = PaletteInspectorViewOuterState & PaletteMixinState & NodesMixinState;

export class PaletteInspectorView extends Mixer<PaletteInspectorViewProps, PaletteInspectorViewState> {

  public static displayName = "PaletteInspectorView";

  private palette: HTMLDivElement | null;

  private fixedPaletteItemIds = ["1", "flow-variable"];

  constructor(props: PaletteInspectorViewProps) {
    super(props);
    this.mixins = [new PaletteMixin(this), new NodesMixin(this)];
    const outerState: PaletteInspectorViewOuterState = {
    };
    this.setInitialState(outerState, PaletteMixin.InitialState(), NodesMixin.InitialState());
  }

  public render() {
    const index = 0;
    return (
      <div className="palette-inspector">
        <div className="palette" ref={el => this.palette = el}>
          <div>
            <PaletteAddView label={tr("~PALETTE-INSPECTOR.ADD_IMAGE")} />
            {_.map(this.orderedPalette(), (node, index) => {
              return <PaletteItemView
                key={index}
                node={node}
                image={node.image}
                // selected={index === this.state.selectedPaletteIndex}
                onSelect={this.handleImageSelected}
              />;
            })}
          </div>
        </div>
        {this.state.selectedPaletteItem ?
          <div className="palette-about-image">
            <div className="palette-about-image-info">
              {this.state.selectedPaletteItem.metadata
                ? <ImageMetadataView small={true} metadata={this.state.selectedPaletteItem.metadata} update={PaletteActions.update} />
                : undefined}
              {!this.isFixedPaletteItem(this.state.selectedPaletteItem) ?
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

  private orderedPalette() {
    const result: PalleteItem[] = [];
    const itemsById: Record<string, PalleteItem> = {};
    this.state.palette.forEach(item => itemsById[item.id] = item);
    this.fixedPaletteItemIds.forEach(id => {
      if (itemsById[id]) {
        result.push(itemsById[id]);
      }
    });
    this.state.palette.forEach(item => {
      if (!this.isFixedPaletteItem(item)) {
        result.push(item);
      }
    });
    return result;
  }

  private isFixedPaletteItem(paletteItem: PalleteItem) {
    return this.fixedPaletteItemIds.indexOf(paletteItem.id) >= 0;
  }
}
