/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import * as React from "react";

import { PreviewImageDialogView } from "../views/preview-image-dialog-view";
import { hasValidImageExtension } from "../utils/has-valid-image-extension";
import { ImageDialogActions } from "../stores/image-dialog-store";
import { Mixin } from "./components";

export interface ImageDialogViewMixinProps {
  selectedImage: any; // TODO: get concrete type
}

export interface ImageDialogViewMixinState {}

export class ImageDialogViewMixin extends Mixin<ImageDialogViewMixinProps, ImageDialogViewMixinState> {

  public imageSelected(imageInfo) {
    return ImageDialogActions.update(imageInfo);
  }

  public hasValidImageExtension(imageName) {
    return hasValidImageExtension(imageName);
  }

  public renderPreviewImage() {
    return <PreviewImageDialogView imageInfo={this.props.selectedImage} />;
  }

  // Event handler, usually used together with drop zone view.
  // That's why it's necessary to ensure that it's bound to correct `this` object.
  public handleImageDrop = (imageInfo) => {
    return this.imageSelected(imageInfo);
  }
}

ImageDialogViewMixin.InitialState = () => ({});

