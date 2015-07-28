ProtoNodeView  = React.createFactory require './proto-node-view'
ImageMetadata  = React.createFactory require './image-metadata-view'

PaletteManager = require "../models/palette-manager"
tr             = require "../utils/translate"


{div, img, i, span} = React.DOM

PaletteAddImage = React.createFactory React.createClass
  render: ->
    (div {className: 'palette-image'},
      (div {className: 'palette-add-image', onClick: @props.onClick},
        (i {className: "fa fa-plus-circle"})
        tr '~PALETTE-INSPECTOR.ADD_IMAGE'
      )
    )

PaletteImage = React.createFactory React.createClass
  displayName: 'PaletteImage'
  clicked: ->
    @props.onSelect @props.index
  render: ->
    (div {className: 'palette-image'},
      (ProtoNodeView {
        key: @props.index,
        image: @props.node.image,
        title: @props.node.title,
        onNodeClicked: @clicked
        })
      (div {className: 'palette-image-selected'}, if @props.selected then (i {className: "fa fa-check-circle"}) else '')
    )

module.exports = React.createClass

  displayName: 'PaletteInspector'
  mixins: [ require '../mixins/palette-listening']

  getInitialState: ->
    selectedIndex = _.findIndex @props.palette, (node) -> node.image.length > 0
    selectedImage = @props.palette[selectedIndex]?.image

    initialState =
      selectedIndex: selectedIndex
      selectedImage: selectedImage
      metadata: @getMetadata selectedImage

  imageSelected: (index) ->
    # @setState
    #   selectedIndex: index
    #   selectedImage: selectedImage
    #   metadata: @getMetadata selectedImage

  getMetadata: (image) ->
    metadata = @props.linkManager.getImageMetadata image
    if not metadata
      # if no metadata is found then this is a dropped image
      metadata =
        source: 'external'
        title: ''
        link: ''
    metadata

  scrollToBottom: ->
    palette = @refs.palette?.getDOMNode()
    if palette
      palette.scrollTop = palette.scrollHeight;

  componentDidMount: ->
    @scrollToBottom()

  componentDidUpdate: (prevProps) ->
    if JSON.stringify(prevProps.palette) isnt JSON.stringify(@props.palette)
      @scrollToBottom()

  setImageMetadata: (image, metadata) ->
    @props.linkManager.setImageMetadata image, metadata
    @setState metadata: metadata

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
                selected: index is @state.selectedIndex
                onSelect: @imageSelected
              })
        )
      )
      (div {className: 'palette-about-image'},
        (div {className: 'palette-about-image-title'},
          (i {className: "fa fa-info-circle"})
          (span {}, tr '~PALETTE-INSPECTOR.ABOUT_IMAGE')
          (img {src: @state.selectedImage})
        )
        if @state.selectedImage
          (div {className: 'palette-about-image-info'},
            (ImageMetadata {metadata: @state.metadata, image: @state.selectedImage, setImageMetadata: @setImageMetadata})
          )
      )
    )
