{div} = React.DOM

module.exports = React.createClass

  displayName: 'Placeholder'

  render: ->
    (div {className: "placeholder #{@props.className}"},
      (div {className: 'placeholder-content'}, @props.label)
    )
