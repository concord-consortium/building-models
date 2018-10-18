tr = require '../utils/translate'
PaletteDialogStore = require '../stores/palette-delete-dialog-store'
ImagePickerView = React.createFactory require './image-picker-view'

{div, span, i, img, button, a} = React.DOM

module.exports = React.createClass

  displayName: 'PaletteDeleteView'
  changePalette: (args) ->
    PaletteDialogStore.actions.select args

  cancel: ->
    @props.cancel?()

  ok: ->
    @props.ok?()


  renderArrow: ->
    if @props.showReplacement
      (div {className: "vertical-content"},
        (i {className: 'arrow-div icon-codap-right-arrow'})
      )

  renderReplacement: ->
    if @props.showReplacement
      (div {className: "vertical-content"},
        (div {className: "label"}, tr "~PALETTE-DIALOG.REPLACE")
        (ImagePickerView {
          selected: @props.replacement
          onChange: @changePalette
        })
      )

  renderPaletteItem: ->
    oldImage   = @props.paletteItem?.image
    (div {className: "vertical-content"},
      (div {className: "label"}, tr "~PALETTE-DIALOG.DELETE")
      if oldImage
        (img {src: oldImage})
    )

  renderButtons: ->
    (div {className: "vertical-content buttons"},
      (div {},
        (button {className: 'button ok', onClick: @ok}, tr "~PALETTE-DIALOG.OK")
      )
      (div {className: "cancel"},
        (a {onClick: @cancel}, tr "~PALETTE-DIALOG.CANCEL")
      )
    )

  render: ->
    (div {className: 'palette-delete-view'},
      (div {className: 'horizontal-content'},
        @renderPaletteItem()
        @renderArrow()
        @renderReplacement()
        @renderButtons()
      )
    )
