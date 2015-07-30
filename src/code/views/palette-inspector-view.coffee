ProtoNodeView  = React.createFactory require './proto-node-view'
ImageMetadata  = React.createFactory require './image-metadata-view'

PaletteManager = require "../models/palette-manager"
tr             = require "../utils/translate"


{div, img, i, span} = React.DOM

PaletteAddImage = React.createFactory React.createClass
  render: ->
    (div {className: 'palette-image'},
      (div {className: 'palette-add-image', onClick: @props.onClick},
        tr '~PALETTE-INSPECTOR.ADD_IMAGE'
      )
    )

PaletteImage = React.createFactory React.createClass
  displayName: 'PaletteImage'
  clicked: ->
    @props.onSelect @props.index
  render: ->
    className = "palette-image"
    className = "palette-image selected" if @props.selected
    (div {className: className},
      (ProtoNodeView {
        key: @props.index,
        image: @props.node.image,
        title: @props.node.title,
        onNodeClicked: @clicked
        selected: @props.selected
        })
    )

module.exports = React.createClass

  displayName: 'PaletteInspector'
  mixins: [ require '../mixins/palette-listening']

  imageSelected: (index) ->
    PaletteManager.actions.selectPaletteIndex(index)

  render: ->
    (div {className: 'palette-inspector'},
      (div {className: 'palette', ref: 'palette'},
        (div {},
          (PaletteAddImage {onClick: @props.toggleImageBrowser})
          for node, index in @state.palette
            if node.image
              (PaletteImage {
                key: node.id
                node: node
                index: index
                selected: index is @state.selectedPaletteIndex
                onSelect: @imageSelected
              })
        )
      )
      (div {className: 'palette-about-image'},
        (div {className: 'palette-about-image-title'},
          (i {className: "fa fa-info-circle"})
          (span {}, tr '~PALETTE-INSPECTOR.ABOUT_IMAGE')
          (img {src: @state.selectedPaletteItem?.image})
        )
        if @state.selectedPaletteItem?.image
          (div {className: 'palette-about-image-info'},
            (ImageMetadata {})
          )
      )
    )
