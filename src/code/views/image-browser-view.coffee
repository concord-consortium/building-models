ModalTabbedDialog = require './modal-tabbed-dialog-view'
TabbedPanel = require './tabbed-panel-view'
ModalTabbedDialogFactory = React.createFactory ModalTabbedDialog
ImageMetadata = React.createFactory require './image-metadata-view'
ImageSearchDialog = React.createFactory require './image-search-dialog-view'
MyComputerDialog = React.createFactory require './image-my-computer-dialog-view'
LinkDialog = React.createFactory require './image-link-dialog-view'
PaletteStore = require "../stores/palette-store"
ImageDialogStore = require "../stores/image-dialog-store"

tr = require '../utils/translate'
{div, img, i, span} = React.DOM

module.exports = React.createClass
  displayName: 'ImageBrowser'
  mixins: [ImageDialogStore.mixin, PaletteStore.mixin]

  render:  ->
    store = PaletteStore.store

    props =
      palette: @state.palette
      internalLibrary: @state.library
      inPalette: store.inPalette
      inLibrary: store.inLibrary
      selectedImage: @state.paletteItem #from ImageDialogStore mixin

    (ModalTabbedDialogFactory {title: (tr "~ADD-NEW-IMAGE.TITLE"), close: @actions.close, tabs: [
      TabbedPanel.Tab {label: (tr "~ADD-NEW-IMAGE.IMAGE-SEARCH-TAB"), component: (ImageSearchDialog props)}
      TabbedPanel.Tab {label: (tr "~ADD-NEW-IMAGE.MY-COMPUTER-TAB"), component: (MyComputerDialog props)}
      TabbedPanel.Tab {label: (tr "~ADD-NEW-IMAGE.LINK-TAB"), component: (LinkDialog props)}
    ]})
