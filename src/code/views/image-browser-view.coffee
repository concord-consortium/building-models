ModalTabbedDialog = require './modal-tabbed-dialog-view'
ModalTabbedDialogFactory = React.createFactory ModalTabbedDialog
ImageMetadata = React.createFactory require './image-metadata-view'
ImageSearchDialog = React.createFactory require './image-search-dialog-view'
MyComputerDialog = React.createFactory require './image-my-computer-dialog-view'
LinkDialog = React.createFactory require './image-link-dialog-view'
tr = require '../utils/translate'

module.exports = React.createClass
  displayName: 'Image Browser'
  render: ->
    props =
      palette: @props.palette
      internalLibrary: @props.internalLibrary
      addToPalette: @props.addToPalette
      inPalette: @props.inPalette
      inLibrary: @props.inLibrary
      linkManager: @props.linkManager

    (ModalTabbedDialogFactory {title: (tr "~ADD-NEW-IMAGE.TITLE"), close: @props.close, tabs: [
      ModalTabbedDialog.Tab {label: (tr "~ADD-NEW-IMAGE.IMAGE-SEARCH-TAB"), component: (ImageSearchDialog props)}
      ModalTabbedDialog.Tab {label: (tr "~ADD-NEW-IMAGE.MY-COMPUTER-TAB"), component: (MyComputerDialog props)}
      ModalTabbedDialog.Tab {label: (tr "~ADD-NEW-IMAGE.LINK-TAB"), component: (LinkDialog props)}
    ]})
