PaletteItemView    = React.createFactory require './palette-item-view'
PaletteAddView     = React.createFactory require './palette-add-view'
ImageMetadata      = React.createFactory require './image-metadata-view'

PaletteStore       = require "../stores/palette-store"
PaletteDialogStore = require "../stores/palette-delete-dialog-store"
NodesStore         = require "../stores/nodes-store"

tr                 = require "../utils/translate"

{label, div, img, i, span} = React.DOM


module.exports = React.createClass

  displayName: 'PaletteInspector'
  mixins: [ PaletteStore.mixin, NodesStore.mixin ]

  imageSelected: (index) ->
    PaletteStore.actions.selectPaletteIndex(index)

  delete: ->
    PaletteDialogStore.actions.open()

  render: ->
    index = 0
    (div {className: 'palette-inspector'},
      (div {className: 'palette', ref: 'palette'},
        (div {},
          (PaletteAddView {})
          # _.forEach @state.palette, (node,index) =>
          _.map @state.palette, (node, index) =>
            (PaletteItemView {
              key: index
              index: index
              node: node
              image: node.image
              selected: index is @state.selectedPaletteIndex
              onSelect: @imageSelected
            })
        )
      )
      if @state.selectedPaletteItem
        (div {className: 'palette-about-image'},
          (div {className: 'palette-about-image-title'},
            (i {className: "fa fa-info-circle"})
            (span {}, tr '~PALETTE-INSPECTOR.ABOUT_IMAGE')
            (img {src: @state.selectedPaletteImage})
          )
          unless @state.palette.length is 1 and @state.paletteItemHasNodes
            (div {className: 'palette-delete', onClick: @delete},
              if @state.paletteItemHasNodes
                (span {},
                  (i {className: "fa fa-recycle"})
                  (label {}, tr '~PALETTE-INSPECTOR.REPLACE')
                )
              else
                (span {},
                  (i {className: "fa fa-trash"})
                  (label {}, tr '~PALETTE-INSPECTOR.DELETE')
                )
            )
          (div {className: 'palette-about-image-info'},
            if @state.selectedPaletteItem.metadata
              (ImageMetadata {
                metadata: @state.selectedPaletteItem.metadata,
                update: PaletteStore.actions.update})
          )
      )
    )
