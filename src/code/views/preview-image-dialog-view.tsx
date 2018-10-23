import * as React from "react";

import { ImageMetadataView } from "./image-metadata-view";
const ImageManger   = require("../stores/image-dialog-store");
const PaletteStore  = require("../stores/palette-store");

import { tr } from "../utils/translate";

interface PreviewImageDialogViewProps {
  key: string;
  imageInfo: any; // TODO: get concrete type
}

export class PreviewImageDialogView extends React.Component<PreviewImageDialogViewProps, {}> {

  public static displayName = "PreviewImageDialogView";

  public render() {
    return (
      <div key={this.props.key}>
        <div className="header">{tr("~IMAGE-BROWSER.PREVIEW")}</div>
        <div className="preview-image">
          <img src={this.props.imageInfo != null ? this.props.imageInfo.image : undefined} />
          <a href="#" onClick={this.handleCancel}>
            <i className="icon-codap-ex" />
            cancel
          </a>
        </div>
        <div className="preview-add-image">
          <button onClick={this.handleAddImage}>{tr("~IMAGE-BROWSER.ADD_IMAGE")}</button>
        </div>
        {(this.props.imageInfo != null ? this.props.imageInfo.metadata : undefined) ?
          <div className="preview-metadata">
            <ImageMetadataView
              metadata={this.props.imageInfo.metadata}
              update={ImageManger.actions.update}
            />
          </div> : undefined}
      </div>
    );
  }

  private handleCancel = (e) => {
    e.preventDefault();
    ImageManger.actions.cancel();
  }

  private handleAddImage = () => {
    PaletteStore.actions.addToPalette(this.props.imageInfo);
  }
}
