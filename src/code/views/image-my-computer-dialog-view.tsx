import { DropZoneView } from "./dropzone-view";
import { ImageDialogMixin } from "../stores/image-dialog-store";

import { tr } from "../utils/translate";
import { ImageDialogViewMixin } from "../mixins/image-dialog-view";

export const ImageMyComputerDialogView = React.createClass({

  displayName: "ImageMyComputerDialogView",

  mixins: [ ImageDialogMixin, ImageDialogViewMixin ],

  previewImage(e) {
    e.preventDefault();
    const { files } = this.refs.file;
    if (files.length === 0) {
      alert(tr("~IMAGE-BROWSER.PLEASE_DROP_FILE"));
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
      reader.readAsDataURL(files[0]);
    }
  },

  render() {
    return (
      <div className="my-computer-dialog">
        {this.state.selectedImage
          ? this.renderPreviewImage()
          : <div>
              <DropZoneView header={tr("~IMAGE-BROWSER.DROP_IMAGE_FROM_DESKTOP")} dropped={this.imageDropped} />
              <p>{tr("~IMAGE-BROWSER.CHOOSE_FILE")}</p>
              <p><input ref="file" type="file" onChange={this.previewImage} /></p>
            </div>}
      </div>
    );
  }
});
