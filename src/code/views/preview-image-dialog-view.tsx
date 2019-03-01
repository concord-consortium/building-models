import * as React from "react";

import { ImageMetadataView } from "./image-metadata-view";
import { ImageDialogActions } from "../stores/image-dialog-store";
import { PaletteActions } from "../stores/palette-store";

import { tr } from "../utils/translate";

export interface ImageMetadata {
  license: string;
  title: string;
  link: string;
  source: string;
}

export interface ImageInfo {
  image: string;
  metadata: ImageMetadata;
}

interface PreviewImageDialogViewProps {
  imageInfo: ImageInfo;
}

interface PreviewImageDialogViewState {}

export class PreviewImageDialogView extends React.Component<PreviewImageDialogViewProps, PreviewImageDialogViewState> {

  public static displayName = "PreviewImageDialogView";

  public render() {
    return (
      <div>
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
              update={ImageDialogActions.update}
            />
          </div> : undefined}
      </div>
    );
  }

  private handleCancel = (e) => {
    e.preventDefault();
    ImageDialogActions.cancel();
  }

  private handleAddImage = () => {
    PaletteActions.addToPalette(this.props.imageInfo);
  }
}
