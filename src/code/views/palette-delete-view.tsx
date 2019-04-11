import * as React from "react";
const log = require("loglevel");

import { tr } from "../utils/translate";
import { PaletteDeleteDialogActions } from "../stores/palette-delete-dialog-store";
import { ImagePickerView } from "./image-picker-view";
import { PalleteItem } from "../stores/palette-store";

interface PaletteDeleteViewProps {
  showReplacement: boolean;
  replacement: PalleteItem;
  paletteItem?: PalleteItem;
  cancel?: () => void;
  ok?: () => void;
}

interface PaletteDeleteViewState {}

export class PaletteDeleteView extends React.Component<PaletteDeleteViewProps, PaletteDeleteViewState> {

  public static displayName = "PaletteDeleteView";

  public render() {
    return (
      <div className="palette-delete-view">
        <div className="horizontal-content">
          {this.renderPaletteItem()}
          {this.renderArrow()}
          {this.renderReplacement()}
          {this.renderButtons()}
        </div>
      </div>
    );
  }

  public renderArrow() {
    if (this.props.showReplacement) {
      return (
        <div className="vertical-content">
          <i className="arrow-div icon-codap-right-arrow" />
        </div>
      );
    }
  }

  private renderReplacement() {
    if (this.props.showReplacement) {
      return (
        <div className="vertical-content">
          <div className="label">{tr("~PALETTE-DIALOG.REPLACE")}</div>
          <ImagePickerView
            selected={this.props.replacement}
            onChange={this.handleChangePalette}
          />
        </div>
      );
    }
  }

  private renderPaletteItem() {
    const oldImage = this.props.paletteItem != null ? this.props.paletteItem.image : undefined;
    return (
      <div className="vertical-content">
        <div className="label">{tr("~PALETTE-DIALOG.DELETE")}</div>
        {oldImage ? <img src={oldImage} /> : undefined}
      </div>
    );
  }

  private renderButtons() {
    return (
      <div className="vertical-content buttons">
        <div>
          <button className="button ok" onClick={this.handleOk}>{tr("~PALETTE-DIALOG.OK")}</button>
        </div>
        <div className="cancel">
          <a onClick={this.handleCancel}>{tr("~PALETTE-DIALOG.CANCEL")}</a>
        </div>
      </div>
    );
  }

  private handleChangePalette = (args) => {
    return PaletteDeleteDialogActions.select(args);
  }

  private handleCancel = () => {
    if (this.props.cancel) {
      this.props.cancel();
    }
  }

  private handleOk = () => {
    if (this.props.ok) {
      this.props.ok();
    }
  }
}
