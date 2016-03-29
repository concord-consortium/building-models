{div} = React.DOM
tr = require '../utils/translate'
Colors = require '../utils/colors'

ColorChoice = React.createFactory React.createClass
  displayName: 'ColorChoice'

  selectColor: ->
    @props.onChange @props.color

  render: ->
    name = @props.color.name
    value = @props.color.value
    className = 'color-choice'
    if @props.selected is value
      className = 'color-choice selected'

    (div {className: className, onClick: @selectColor},
      (div {className: 'color-swatch', style: {'backgroundColor': value}})
      (div {className: 'color-label'}, name)
    )

module.exports = React.createClass

  displayName: 'ColorPickerView'

  getInitialState: ->
    opened: false

  select: (color) ->
    @props.onChange(color.value)

  toggleOpen: ->
    @setState
      opened: (not @state.opened)

  className: ->
    if @state.opened
      "color-picker opened"
    else
      "color-picker closed"

  render: ->
    (div {className: @className(), onClick: @toggleOpen},
      for color in Colors
        (ColorChoice {key: color.name, color: color, selected: @props.selected, onChange: @select})
    )
