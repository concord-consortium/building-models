/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const DropZone = React.createFactory(require("./dropzone-view"));
const ImageDialogStore = require("../stores/image-dialog-store");
const tr = require("../utils/translate");

const {div, p, input} = React.DOM;

module.exports = React.createClass({
  displayName: "Link",

  mixins: [ ImageDialogStore.mixin, require("../mixins/image-dialog-view")],


  previewImage(e) {
    e.preventDefault();
    const url = $.trim(this.refs.url.value);
    if (url.length === 0) {
      return alert(tr("~IMAGE-BROWSER.PLEASE_DROP_IMAGE"));
    } else if (this.hasValidImageExtension(url)) {
      return this.imageSelected({
        image: url,
        metadata: {
          source: "external",
          link: url
        }
      });
    }
  },

  render() {
    return (div({className: "link-dialog"},
      this.state.selectedImage ?
        this.renderPreviewImage()
        :
        (div({},
          (DropZone({header: (tr("~IMAGE-BROWSER.DROP_IMAGE_FROM_BROWSER")), dropped: this.imageDropped})),
          (p({}, (tr("~IMAGE-BROWSER.TYPE_OR_PASTE_LINK")))),
          (p({}, (tr("~IMAGE-BROWSER.IMAGE_URL")), (input({ref: "url", type: "text"})))),
          (p({}, (input({type: "submit", onClick: this.previewImage, value: (tr("~IMAGE-BROWSER.PREVIEW_IMAGE"))}))))
        ))
    ));
  }
});
