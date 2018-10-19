/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const ImageMetadata = React.createFactory(require("./image-metadata-view"));
const ImageManger   = require("../stores/image-dialog-store");
const PaletteStore  = require("../stores/palette-store");

const tr = require("../utils/translate");

const {div, button, img, i, a} = React.DOM;
module.exports = React.createClass({
  displayName: "ImageSearchResult",

  cancel(e) {
    e.preventDefault();
    return ImageManger.actions.cancel();
  },

  addImage() {
    return PaletteStore.actions.addToPalette(this.props.imageInfo);
  },

  render() {
    return (div({key: this.props.key},
      (div({className: "header"}, tr("~IMAGE-BROWSER.PREVIEW"))),
      (div({className: "preview-image"},
        (img({src: (this.props.imageInfo != null ? this.props.imageInfo.image : undefined)})),
        (a({href: "#", onClick: this.cancel},
          (i({className: "icon-codap-ex"})),
          "cancel"
        ))
      )),
      (div({className: "preview-add-image"},
        (button({onClick: this.addImage}, tr("~IMAGE-BROWSER.ADD_IMAGE")))
      )),
      (this.props.imageInfo != null ? this.props.imageInfo.metadata : undefined) ?
        (div({className: "preview-metadata"},
          (ImageMetadata({
            metadata: this.props.imageInfo.metadata,
            update:  ImageManger.actions.update,
            className: "image-browser-preview-metadata"
          }))
        )) : undefined
    ));
  }
});
