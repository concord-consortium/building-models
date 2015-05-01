ProtoNodeView = React.createFactory require './proto-node-view'
ImageMetadata = React.createFactory require './image-metadata-view'
tr = require "../utils/translate"

{div, img, i, span} = React.DOM

PaletteImage = React.createFactory React.createClass
  displayName: 'PaletteImage'
  clicked: ->
    @props.onSelect @props.index
  render: ->
    (div {className: 'palette-image'},
      (ProtoNodeView {key: @props.index, image: @props.node.image, title: @props.node.title, onNodeClicked: @clicked})
      (div {className: 'palette-image-selected'}, if @props.selected then (i {className: "fa fa-check-circle"}) else '')
    )

module.exports = React.createClass

  displayName: 'PaletteInspector'

  getInitialState: ->
    selectedIndex: _.findIndex @props.protoNodes, (node) -> node.image.length > 0

  imageSelected: (index) ->
    @setState selectedIndex: index

  scrollToBottom: ->
    palette = @refs.palette?.getDOMNode()
    if palette
      palette.scrollTop = palette.scrollHeight;

  componentDidMount: ->
    @scrollToBottom()

  componentDidUpdate: (prevProps) ->
    if JSON.stringify(prevProps.protoNodes) isnt JSON.stringify(@props.protoNodes)
      @scrollToBottom()

  render: ->
    selectedImage = @props.protoNodes[@state.selectedIndex].image
    metadata = @props.linkManager.getImageMetadata selectedImage

    (div {className: 'palette-inspector'},
      (div {className: 'palette', ref: 'palette'},
        (div {},
          for node, index in @props.protoNodes
            if node.image
              (PaletteImage {node: node, index: index, selected: index is @state.selectedIndex, onSelect: @imageSelected})
          (div {className: 'palette-add-image', onClick: @props.toggleImageBrowser},
            (i {className: "fa fa-plus-circle"})
            tr '~PALETTE-INSPECTOR.ADD_IMAGE'
          )
        )
      )
      (div {className: 'palette-about-image'},
        (div {className: 'palette-about-image-title'},
          (i {className: "fa fa-info-circle"})
          (span {}, tr '~PALETTE-INSPECTOR.ABOUT_IMAGE')
          (img {src: selectedImage})
        )
        (div {className: 'palette-about-image-info'},
          if metadata
            (ImageMetadata {metadata: metadata})
          else
            'TDB: Add metadata for internal library images'
        )
      )
    )
