import { DropZoneView } from "./dropzone-view";
import { ImageDialogMixin } from "../stores/image-dialog-store";
import { tr } from "../utils/translate";
import { ImageDialogViewMixin } from "../mixins/image-dialog-view";

export const ImageLinkDialogView = React.createClass({

  displayName: "ImageLinkDialogView",

  mixins: [ ImageDialogMixin, ImageDialogViewMixin ],

  previewImage(e) {
    e.preventDefault();
    const url = $.trim(this.refs.url.value);
    if (url.length === 0) {
      alert(tr("~IMAGE-BROWSER.PLEASE_DROP_IMAGE"));
    } else if (this.hasValidImageExtension(url)) {
      this.imageSelected({
        image: url,
        metadata: {
          source: "external",
          link: url
        }
      });
    }
  },

  render() {
    return (
      <div className="link-dialog">
        {this.state.selectedImage
          ? this.renderPreviewImage()
          : <div>
              <DropZoneView header={tr("~IMAGE-BROWSER.DROP_IMAGE_FROM_BROWSER")} dropped={this.imageDropped} />
              <p>{tr("~IMAGE-BROWSER.TYPE_OR_PASTE_LINK")}</p>
              <p>
                {tr("~IMAGE-BROWSER.IMAGE_URL")}
                <input ref="url" type="text" />
              </p>
              <p>
                <input type="submit" onClick={this.previewImage} value={tr("~IMAGE-BROWSER.PREVIEW_IMAGE")} />
              </p>
            </div>}
      </div>
    );
  }
});
