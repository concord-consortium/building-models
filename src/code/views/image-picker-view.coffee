{div, img} = React.DOM
tr = require '../utils/translate'
PaletteAddView     = React.createFactory require './palette-add-view'

ImgChoice = React.createFactory React.createClass
  displayName: 'ImgChoice'

  selectNode: ->
    @props.onChange @props.node

  render: ->
    className = "image-choice"
    if @props.node.image is @props.selected.image
      className = "image-choice selected"
    (div {className: className, onClick: @selectNode},
      (img {src: @props.node.image, className: 'image-choice'})
    )

module.exports = React.createClass

  displayName: 'ImagePickerView'

  getInitialState: ->
    opened: false

  toggleOpen: ->
    @setState
      opened: (not @state.opened)

  className: ->
    if @state.opened
      "image-choices opened"
    else
      "image-choices closed"

  render: ->
    (div {onClick: @toggleOpen, className: 'image-picker'},
      (div {className: 'selected-image'},
        (img {src: @props.selected.image})
      )
      (div {className: @className()},
        (PaletteAddView {callback:  @props.onChange })
        for node in @props.nodes
          (ImgChoice {key: node.id, node: node, selected: @props.selected, onChange: @props.onChange})
      )
    )
