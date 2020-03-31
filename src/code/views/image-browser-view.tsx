import * as React from "react";

import { ModalTabbedDialogView } from "./modal-tabbed-dialog-view";
import { TabbedPanelView } from "./tabbed-panel-view";
import { ImageSearchDialogView } from "./image-search-dialog-view";
import { ImageMyComputerDialogView } from "./image-my-computer-dialog-view";
import { ImageLinkDialogView } from "./image-link-dialog-view";

import { PaletteStore } from "../stores/palette-store";

import { tr } from "../utils/translate";

import { PaletteMixinProps, PaletteMixinState, PaletteMixin } from "../stores/palette-store";
import { ImageDialogActions, ImageDialogMixin, ImageDialogMixinState, ImageDialogMixinProps } from "../stores/image-dialog-store";
import { Mixer } from "../mixins/components";

interface ImageBrowserViewOuterProps {}
type ImageBrowserViewProps = ImageBrowserViewOuterProps & PaletteMixinProps & ImageDialogMixinProps;

interface ImageBrowserViewOuterState {
}

interface ImageBrowserViewTabState {
  selectedTabIndex: number;
}
const ImageBrowserViewTabInitialState = {
  selectedTabIndex: 0
};

type ImageBrowserViewState = ImageBrowserViewOuterState & PaletteMixinState & ImageDialogMixinState & ImageBrowserViewTabState;

export class ImageBrowserView extends Mixer<ImageBrowserViewProps, ImageBrowserViewState> {

  public static displayName = "ImageBrowserView";

  constructor(props: ImageBrowserViewProps) {
    super(props);

    this.mixins = [new ImageDialogMixin(this), new PaletteMixin(this)];
    const outerState: ImageBrowserViewOuterState = {};
    this.setInitialState(outerState, ImageDialogMixin.InitialState(), PaletteMixin.InitialState(), ImageBrowserViewTabInitialState);
  }

  public render() {
    const props = {
      palette: this.state.palette,
      internalLibrary: this.state.library,
      inPalette: PaletteStore.inPalette,
      inLibrary: PaletteStore.inLibrary,
      selectedImage: this.state.paletteItem // from ImageDialogStore mixin
    };

    return (
      <ModalTabbedDialogView
        title={tr("~ADD-NEW-IMAGE.TITLE")}
        selectedTabIndex={this.state.selectedTabIndex}
        onTabSelected={this.onTabSelected}
        clientClass="image-browser"
        close={ImageDialogActions.close}
        tabs={[
          TabbedPanelView.Tab({label: (tr("~ADD-NEW-IMAGE.IMAGE-SEARCH-TAB")), component: <ImageSearchDialogView {...props} />}),
          TabbedPanelView.Tab({label: (tr("~ADD-NEW-IMAGE.MY-COMPUTER-TAB")), component: <ImageMyComputerDialogView {...props} />}),
          TabbedPanelView.Tab({label: (tr("~ADD-NEW-IMAGE.LINK-TAB")), component: <ImageLinkDialogView {...props} />})
        ]}
      />
    );
  }

  private onTabSelected = (selectedTabIndex) => {
    this.setState({selectedTabIndex});
  }
}
