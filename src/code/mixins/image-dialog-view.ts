/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { PreviewImageDialogView as PreviewImageDialogViewClass } from "../views/preview-image-dialog-view";

const PreviewImage = React.createFactory(PreviewImageDialogViewClass);
import { hasValidImageExtension } from "../utils/has-valid-image-extension";
const ImageDialogStore = require("../stores/image-dialog-store");

export const ImageDialogViewMixin = {

  getInitialImageDialogViewState(subState) {
    return subState;
  },

  imageSelected(imageInfo) {
    return ImageDialogStore.actions.update(imageInfo);
  },

  imageDropped(imageInfo) {
    return this.imageSelected(imageInfo);
  },

  hasValidImageExtension(imageName) {
    return hasValidImageExtension(imageName);
  },

  renderPreviewImage() {
    return (PreviewImage({imageInfo: this.props.selectedImage }));
  }
};
