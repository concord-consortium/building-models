ProtoNodeView = React.createFactory require './proto-node-view'
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
    (div {className: 'palette-inspector'},
      (div {className: 'palette', ref: 'palette'},
        (div {},
          for node, index in @props.protoNodes
            if node.image
              (PaletteImage {node: node, index: index, selected: index is @state.selectedIndex, onSelect: @imageSelected})
          (div {className: 'palette-add-image', onClick: @props.toggleImageBrowser},
            (i {className: "fa fa-plus-circle"})
            'Add new image'
          )
        )
      )
      (div {className: 'palette-about-image'},
        (div {className: 'palette-about-image-title'},
          (i {className: "fa fa-info-circle"})
          (span {}, 'About This Image')
          (img {src: @props.protoNodes[@state.selectedIndex].image})
        )
        (div {className: 'palette-about-image-info'}, 'TBD')
      )
    )
