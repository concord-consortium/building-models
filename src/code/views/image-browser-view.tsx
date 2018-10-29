import * as React from "react";

import { ModalTabbedDialogView } from "./modal-tabbed-dialog-view";
import { TabbedPanelView } from "./tabbed-panel-view";
import { ImageSearchDialogView } from "./image-search-dialog-view";
import { ImageMyComputerDialogView } from "./image-my-computer-dialog-view";
import { ImageLinkDialogView } from "./image-link-dialog-view";

import { PaletteStore } from "../stores/palette-store";

import { tr } from "../utils/translate";

import { PaletteMixin2Props, PaletteMixin2State, PaletteMixin2 } from "../stores/palette-store";
import { ImageDialogActions, ImageDialogMixin2, ImageDialogMixin2State, ImageDialogMixin2Props } from "../stores/image-dialog-store";
import { Mixer } from "../mixins/components";

interface ImageBrowserViewOuterProps {}
type ImageBrowserViewProps = ImageBrowserViewOuterProps & PaletteMixin2Props & ImageDialogMixin2Props;

interface ImageBrowserViewOuterState {
}
type ImageBrowserViewState = ImageBrowserViewOuterState & PaletteMixin2State & ImageDialogMixin2State;

export class ImageBrowserView extends Mixer<ImageBrowserViewProps, ImageBrowserViewState> {

  public static displayName = "ImageBrowserView";

  constructor(props: ImageBrowserViewProps) {
    super(props);

    this.mixins = [new ImageDialogMixin2(this, props), new PaletteMixin2(this, props)];
    this.setInitialState({}, ImageDialogMixin2.InitialState, PaletteMixin2.InitialState);
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
}
