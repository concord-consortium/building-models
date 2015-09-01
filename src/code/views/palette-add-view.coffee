ImageDialogStore   = require "../stores/image-dialog-store"
Draggable          = require '../mixins/draggable'
tr                 = require "../utils/translate"

{div} = React.DOM

module.exports = React.createClass

  displayName: 'PaletteAddView'
  mixins: [Draggable]
  getDefaultProps: ->
    callback: false
    label: tr '~PALETTE-INSPECTOR.ADD_IMAGE'

  render: ->
    (div {
      className: 'palette-add-image',
      'data-droptype': 'new',
      onClick: =>
        ImageDialogStore.actions.open.trigger(@props.callback)
      },
      (div {}, @props.label )
    )
