/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const PreviewImage = React.createFactory(require("../views/preview-image-dialog-view"));
const hasValidImageExtension = require("../utils/has-valid-image-extension");
const ImageDialogStore = require("../stores/image-dialog-store");


module.exports = {

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
