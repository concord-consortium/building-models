import { ModalTabbedDialogView } from "./modal-tabbed-dialog-view";
import { TabbedPanelView } from "./tabbed-panel-view";

const ImageSearchDialog = require("./image-search-dialog-view");
const MyComputerDialog = require("./image-my-computer-dialog-view");
const LinkDialog = require("./image-link-dialog-view");
const PaletteStore = require("../stores/palette-store");
const ImageDialogStore = require("../stores/image-dialog-store");

const tr = require("../utils/translate");

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

    return (
      <ModalTabbedDialogView
        title={tr("~ADD-NEW-IMAGE.TITLE")}
        clientClass="image-browser"
        close={this.actions.close}
        tabs={[
          TabbedPanelView.Tab({label: (tr("~ADD-NEW-IMAGE.IMAGE-SEARCH-TAB")), component: <ImageSearchDialog {...props} />}),
          TabbedPanelView.Tab({label: (tr("~ADD-NEW-IMAGE.MY-COMPUTER-TAB")), component: <MyComputerDialog {...props} />}),
          TabbedPanelView.Tab({label: (tr("~ADD-NEW-IMAGE.LINK-TAB")), component: <LinkDialog {...props} />})
        ]}
      />
    );
  }
});
