ModalDialog         = React.createFactory require './modal-dialog-view'
PaletteDeleteView   = React.createFactory require './palette-delete-view'
PaletteDialogStore  = require '../stores/palette-delete-dialog-store'
NodesStore          = require '../stores/nodes-store'
tr                  = require '../utils/translate'

{div, ul, li, a} = React.DOM

module.exports = React.createClass

  displayName: 'ModalPaletteDelete'
  mixins: [PaletteDialogStore.mixin]

  render: ->
    (div {key:'ModalPaletteDelete'},
      if @state.showing
        title = tr "~PALETTE-DIALOG.TITLE"
        (ModalDialog {title: title, close: PaletteDialogStore.actions.close },
          (PaletteDeleteView {
            options: @state.options
            paletteItem: @state.paletteItem,
            replacement: @state.replacement,
            showReplacement: @state.showReplacement
            cancel: PaletteDialogStore.actions.close
            ok: => PaletteDialogStore.actions.delete @state.paletteItem
          })
        )
    )
