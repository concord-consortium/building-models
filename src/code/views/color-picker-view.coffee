{div} = React.DOM
tr = require '../utils/translate'


module.exports = React.createClass

  displayName: 'ColorPickerView'

  getInitialState: ->
    opened: false
    selectedColor: tr("yellow")
    colors: [
      {color: '#f5be32', name: tr("yellow")}
      {color: 'red', name: tr("red")}
      {color: 'gray', name: tr("gray")}
    ]

  select: (colorName) ->
    @setState
      selectedColor: colorName

  toggleOpen: ->
    @setState
      opened: (not @state.opened)

  className: ->
    if @state.opened
      "color-picker opened"
    else
      "color-picker closed"

  render: ->
    colors=@state.colors
    colorAttr = (color) =>
      name = color.name
      className = 'color-choice'
      onClick = =>
        @select(name)
      if color.name is @state.selectedColor
        className = 'color-choice selected'
        onClick = -> {}

      name: color.name
      color: color.color
      onClick: onClick
      className: className

    (div {className: @className(), onClick: @toggleOpen},
      for color in colors
        attr = colorAttr(color)
        (div {className: attr.className, onClick: attr.onClick},
          (div {className: 'color-swatch', style: {'background-color': attr.color}})
          (div {className: 'color-label'}, attr.name)
        )
    )
