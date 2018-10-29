const _ = require("lodash");
import * as React from "react";

import { PaletteItemView } from "./palette-item-view";
import { PaletteAddView } from "./palette-add-view";
import { ImageMetadataView } from "./image-metadata-view";

import { PaletteActions, PaletteMixin } from "../stores/palette-store";
import { PaletteDeleteDialogActions } from "../stores/palette-delete-dialog-store";
import { NodesMixin2, NodesMixin2Props, NodesMixin2State } from "../stores/nodes-store";

import { tr } from "../utils/translate";

import { PaletteMixin2Props, PaletteMixin2State, PaletteMixin2 } from "../stores/palette-store";
import { Mixer } from "../mixins/components";

interface PaletteInspectorViewOuterProps {}
type PaletteInspectorViewProps = PaletteInspectorViewOuterProps & PaletteMixin2Props & NodesMixin2Props;

interface PaletteInspectorViewOuterState {
}
type PaletteInspectorViewState = PaletteInspectorViewOuterState & PaletteMixin2State & NodesMixin2State;

export class PaletteInspectorView extends Mixer<PaletteInspectorViewProps, PaletteInspectorViewState> {

  public static displayName = "PaletteInspectorView";

  constructor(props: PaletteInspectorViewProps) {
    super(props);
    this.mixins = [new PaletteMixin2(this, props), new NodesMixin2(this, props)];
    const outerState: PaletteInspectorViewOuterState = {
    };
    this.setInitialState(outerState, PaletteMixin2.InitialState, NodesMixin2.InitialState);
  }

  public render() {
    const index = 0;
    return (
      <div className="palette-inspector">
        <div className="palette" ref="palette">
          <div>
            <PaletteAddView label={tr("~PALETTE-INSPECTOR.ADD_IMAGE")} />
            {_.map(this.state.palette, (node, index) => {
              return <PaletteItemView
                key={index}
                index={index}
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
            <div className="palette-about-image-title">
              <i className="icon-codap-info" />
              <span>{tr("~PALETTE-INSPECTOR.ABOUT_IMAGE")}</span>
              <img src={this.state.selectedPaletteImage} />
            </div>
            {(this.state.palette.length !== 1) || !this.state.paletteItemHasNodes ?
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
            <div className="palette-about-image-info">
              {this.state.selectedPaletteItem.metadata
                ? <ImageMetadataView metadata={this.state.selectedPaletteItem.metadata} update={PaletteActions.update} />
                : undefined}
            </div>
          </div> : undefined}
      </div>
    );
  }

  private handleImageSelected = (index) => {
    PaletteActions.selectPaletteIndex(index);
  }

  private handleDelete = () => {
    PaletteDeleteDialogActions.open();
  }
}
