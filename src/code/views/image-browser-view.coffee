ModalTabbedDialog = require './modal-tabbed-dialog-view'
TabbedPanel = require './tabbed-panel-view'
ModalTabbedDialogFactory = React.createFactory ModalTabbedDialog
ImageMetadata = React.createFactory require './image-metadata-view'
ImageSearchDialog = React.createFactory require './image-search-dialog-view'
MyComputerDialog = React.createFactory require './image-my-computer-dialog-view'
LinkDialog = React.createFactory require './image-link-dialog-view'
PaletteManager = require "../models/palette-manager"

tr = require '../utils/translate'

module.exports = React.createClass
  displayName: 'Image Browser'
  render: ->
    store   = PaletteManager.store
    addToPalette = (node) ->
      PaletteManager.actions.addToPalette.trigger(node)
    props =
      palette: store.palette
      internalLibrary: store.internalLibrary
      addToPalette: addToPalette
      inPalette: store.inPalette
      inLibrary: store.inLibrary
      linkManager: @props.linkManager

    (ModalTabbedDialogFactory {title: (tr "~ADD-NEW-IMAGE.TITLE"), close: @props.close, tabs: [
      TabbedPanel.Tab {label: (tr "~ADD-NEW-IMAGE.IMAGE-SEARCH-TAB"), component: (ImageSearchDialog props)}
      TabbedPanel.Tab {label: (tr "~ADD-NEW-IMAGE.MY-COMPUTER-TAB"), component: (MyComputerDialog props)}
      TabbedPanel.Tab {label: (tr "~ADD-NEW-IMAGE.LINK-TAB"), component: (LinkDialog props)}
    ]})
