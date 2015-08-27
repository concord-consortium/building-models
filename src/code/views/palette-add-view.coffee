ImageDialogStore   = require "../stores/image-dialog-store"
Draggable          = require '../mixins/draggable'
tr                 = require "../utils/translate"

{div} = React.DOM

module.exports = React.createClass

  displayName: 'PaletteAddView'
  mixins: [Draggable]
  defaultProps:
    callback: false

  render: ->
    (div {className: 'palette-image', 'data-droptype': 'new'},
      (div {className: 'palette-add-image', onClick: => ImageDialogStore.actions.open.trigger(@props.callback) },
        (div { className: 'proto-node'},
          (div {className: 'img-background'},
            tr '~PALETTE-INSPECTOR.ADD_IMAGE'
          )
        )
      )
    )
