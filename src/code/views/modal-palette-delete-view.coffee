ModalDialog         = React.createFactory require './modal-dialog-view'
PaletteDeleteView   = React.createFactory require './palette-delete-view'
PaletteDialogStore  = require '../stores/palette-delete-dialog-store'
tr                  = require '../utils/translate'

{div, ul, li, a} = React.DOM

module.exports = React.createClass

  displayName: 'ModalPaletteDelete'
  mixins: [PaletteDialogStore.mixin]

  render: ->
    (div {key:'ModalPaletteDelete'},
      if @state.showing
        title = tr "~PALETTE-DIALOG.TITLE",
        oldName: @state.paletteItem?.title or ""

        (ModalDialog {title: title, close: PaletteDialogStore.actions.close },
          (PaletteDeleteView {
            palette: _.without @state.palette, @state.paletteItem
            paletteItem: @state.paletteItem,
            replacement: @state.replacement,
            cancel: PaletteDialogStore.actions.close
            ok: PaletteDialogStore.actions.delete
          })
        )
    )
