/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

import { DropZoneView as DropZoneViewClass } from "./dropzone-view";
const DropZone = React.createFactory(DropZoneViewClass);
const ImageDialogStore = require("../stores/image-dialog-store");

const tr = require("../utils/translate");

const {div, p, input} = React.DOM;

module.exports = React.createClass({
  displayName: "MyComputer",

  mixins: [ ImageDialogStore.mixin, require("../mixins/image-dialog-view")],

  previewImage(e) {
    e.preventDefault();
    const { files } = this.refs.file;
    if (files.length === 0) {
      return alert(tr("~IMAGE-BROWSER.PLEASE_DROP_FILE"));
    } else if (this.hasValidImageExtension(files[0].name)) {
      const title = (files[0].name.split("."))[0];
      const reader = new FileReader();
      reader.onload = e => {
        return this.imageSelected({
          image: reader.result,
          title,
          metadata: {
            title,
            source: "external"
          }
        });
      };
      return reader.readAsDataURL(files[0]);
    }
  },

  render() {
    return (div({className: "my-computer-dialog"},
      this.state.selectedImage ?
        this.renderPreviewImage()
        :
        (div({},
          (DropZone({header: (tr("~IMAGE-BROWSER.DROP_IMAGE_FROM_DESKTOP")), dropped: this.imageDropped})),
          (p({}, (tr("~IMAGE-BROWSER.CHOOSE_FILE")))),
          (p({}, (input({ref: "file", type: "file", onChange: this.previewImage}))))
        ))
    ));
  }
});
