{div} = React.DOM

module.exports = React.createClass

  displayName: 'Placeholder'
  
  render: ->
    (div {className: "wireframe-placeholder #{@props.className}"},
      (div {className: 'wireframe-placeholder-content'}, @props.label)
    )
