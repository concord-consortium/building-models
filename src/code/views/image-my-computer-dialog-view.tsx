import * as React from "react";

import { DropZoneView } from "./dropzone-view";
import { tr } from "../utils/translate";
import { ImageDialogViewMixin, ImageDialogViewMixinState, ImageDialogViewMixinProps } from "../mixins/image-dialog-view";
import { ImageDialogMixin2, ImageDialogMixin2State, ImageDialogMixin2Props } from "../stores/image-dialog-store";
import { Mixer } from "../mixins/components";


type ImageMyComputerDialogViewProps = ImageDialogMixin2Props & ImageDialogViewMixinProps;
type ImageMyComputerDialogViewState = ImageDialogMixin2State & ImageDialogViewMixinState;

export class ImageMyComputerDialogView extends Mixer<ImageMyComputerDialogViewProps, ImageMyComputerDialogViewState> {

  public static displayName = "ImageMyComputerDialogView";

  private imageDialogViewMixin: ImageDialogViewMixin;
  private file: HTMLInputElement | null;

  constructor(props: ImageMyComputerDialogViewProps) {
    super(props);
    this.imageDialogViewMixin = new ImageDialogViewMixin(this, props);

    this.mixins = [new ImageDialogMixin2(this, props), this.imageDialogViewMixin];
    this.setInitialState({}, ImageDialogMixin2.InitialState, ImageDialogViewMixin.InitialState);
  }

  public render() {
    return (
      <div className="my-computer-dialog">
        {this.state.selectedImage
          ? this.imageDialogViewMixin.renderPreviewImage()
          : <div>
              <DropZoneView header={tr("~IMAGE-BROWSER.DROP_IMAGE_FROM_DESKTOP")} dropped={this.imageDialogViewMixin.imageDropped} />
              <p>{tr("~IMAGE-BROWSER.CHOOSE_FILE")}</p>
              <p><input ref={el => this.file = el} type="file" onChange={this.handlePreviewImage} /></p>
            </div>}
      </div>
    );
  }

  private handlePreviewImage = (e) => {
    e.preventDefault();
    const files = this.file && this.file.files;
    if (!files || files.length === 0) {
      alert(tr("~IMAGE-BROWSER.PLEASE_DROP_FILE"));
    } else if (this.imageDialogViewMixin.hasValidImageExtension(files[0].name)) {
      const title = (files[0].name.split("."))[0];
      const reader = new FileReader();
      reader.onload = e => {
        return this.imageDialogViewMixin.imageSelected({
          image: reader.result,
          title,
          metadata: {
            title,
            source: "external"
          }
        });
      };
      reader.readAsDataURL(files[0]);
    }
  }
}
