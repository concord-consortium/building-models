PaletteItemView  = React.createFactory require './palette-item-view'
ImageMetadata  = React.createFactory require './image-metadata-view'

Draggable      = require '../mixins/draggable'
PaletteManager = require "../models/palette-manager"
tr             = require "../utils/translate"


{div, img, i, span} = React.DOM

PaletteAddImage = React.createFactory React.createClass
  mixins: [Draggable]
  render: ->
    (div {className: 'palette-image', 'data-droptype': 'new'},
      (div {className: 'palette-add-image', onClick: @props.onClick},
        (div { className: 'proto-node'},
          (div {className: 'img-background'},
            tr '~PALETTE-INSPECTOR.ADD_IMAGE'
          )
        )
      )
    )

module.exports = React.createClass

  displayName: 'PaletteInspector'
  mixins: [ require '../mixins/palette-listening']

  imageSelected: (index) ->
    PaletteManager.actions.selectPaletteIndex(index)

  render: ->
    index = 0
    (div {className: 'palette-inspector'},
      (div {className: 'palette', ref: 'palette'},
        (div {},
          (PaletteAddImage {onClick: @props.toggleImageBrowser})
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
      (div {className: 'palette-about-image'},
        (div {className: 'palette-about-image-title'},
          (i {className: "fa fa-info-circle"})
          (span {}, tr '~PALETTE-INSPECTOR.ABOUT_IMAGE')
          (img {src: @state.selectedPaletteImage})
        )
        if @state.selectedPaletteImage
          (div {className: 'palette-about-image-info'},
            (ImageMetadata {image: @state.selectedPaletteImage})
          )
      )
    )
