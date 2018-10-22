/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

import { ModalTabbedDialogView as ModalTabbedDialogViewClass } from "./modal-tabbed-dialog-view";
import { TabbedPanelView } from "./tabbed-panel-view";
const ModalTabbedDialogFactory = React.createFactory(ModalTabbedDialogViewClass);
import { ImageMetadataView as ImageMetadataViewClass } from "./image-metadata-view";
const ImageMetadata = React.createFactory(ImageMetadataViewClass);
const ImageSearchDialog = React.createFactory(require("./image-search-dialog-view"));
const MyComputerDialog = React.createFactory(require("./image-my-computer-dialog-view"));
const LinkDialog = React.createFactory(require("./image-link-dialog-view"));
const PaletteStore = require("../stores/palette-store");
const ImageDialogStore = require("../stores/image-dialog-store");

const tr = require("../utils/translate");
const {div, img, i, span} = React.DOM;

module.exports = React.createClass({
  displayName: "ImageBrowser",
  mixins: [ImageDialogStore.mixin, PaletteStore.mixin],

  render() {
    const { store } = PaletteStore;

    const props = {
      palette: this.state.palette,
      internalLibrary: this.state.library,
      inPalette: store.inPalette,
      inLibrary: store.inLibrary,
      selectedImage: this.state.paletteItem // from ImageDialogStore mixin
    };

    return (ModalTabbedDialogFactory({
      title: tr("~ADD-NEW-IMAGE.TITLE"),
      clientClass: "image-browser",
      close: this.actions.close,
      tabs: [
        TabbedPanelView.Tab({label: (tr("~ADD-NEW-IMAGE.IMAGE-SEARCH-TAB")), component: (ImageSearchDialog(props))}),
        TabbedPanelView.Tab({label: (tr("~ADD-NEW-IMAGE.MY-COMPUTER-TAB")), component: (MyComputerDialog(props))}),
        TabbedPanelView.Tab({label: (tr("~ADD-NEW-IMAGE.LINK-TAB")), component: (LinkDialog(props))})
      ]}));
  }
});
