import * as React from "react";

import { DropZoneView } from "./dropzone-view";
import { ImageDialogMixin2, ImageDialogMixin2State, ImageDialogMixin2Props } from "../stores/image-dialog-store";
import { tr } from "../utils/translate";
import { ImageDialogViewMixin, ImageDialogViewMixinState, ImageDialogViewMixinProps } from "../mixins/image-dialog-view";
import { Mixer } from "../mixins/components";

type ImageLinkDialogViewProps = ImageDialogMixin2Props & ImageDialogViewMixinProps;
type ImageLinkDialogViewState = ImageDialogMixin2State & ImageDialogViewMixinState;

export class ImageLinkDialogView extends Mixer<ImageLinkDialogViewProps, ImageLinkDialogViewState> {
  public static displayName = "ImageLinkDialogView";

  private imageDialogViewMixin: ImageDialogViewMixin;
  private url: HTMLInputElement | null;

  constructor(props: ImageLinkDialogViewProps) {
    super(props);
    this.imageDialogViewMixin = new ImageDialogViewMixin(this, props);

    this.mixins = [new ImageDialogMixin2(this, props), this.imageDialogViewMixin];
    this.setInitialState({}, ImageDialogMixin2.InitialState, ImageDialogViewMixin.InitialState);
  }

  public render() {
    return (
      <div className="link-dialog">
        {this.state.selectedImage
          ? this.imageDialogViewMixin.renderPreviewImage()
          : <div>
              <DropZoneView header={tr("~IMAGE-BROWSER.DROP_IMAGE_FROM_BROWSER")} dropped={this.imageDialogViewMixin.imageDropped} />
              <p>{tr("~IMAGE-BROWSER.TYPE_OR_PASTE_LINK")}</p>
              <p>
                {tr("~IMAGE-BROWSER.IMAGE_URL")}
                <input ref={(el) => this.url = el} type="text" />
              </p>
              <p>
                <input type="submit" onClick={this.handlePreviewImage} value={tr("~IMAGE-BROWSER.PREVIEW_IMAGE")} />
              </p>
            </div>}
      </div>
    );
  }

  private handlePreviewImage = (e) => {
    e.preventDefault();
    const url = $.trim(this.url ? this.url.value : "");
    if (url.length === 0) {
      alert(tr("~IMAGE-BROWSER.PLEASE_DROP_IMAGE"));
    } else if (this.imageDialogViewMixin.hasValidImageExtension(url)) {
      this.imageDialogViewMixin.imageSelected({
        image: url,
        metadata: {
          source: "external",
          link: url
        }
      });
    }
  }
}
