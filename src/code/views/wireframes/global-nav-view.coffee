{div} = React.DOM

module.exports = React.createClass

  displayName: 'GlobalNav'
  
  render: ->
    (div {className: 'wireframe-global-nav wireframe-non-placeholder'},
      (div {className: 'wireframe-global-nav-content-help'}, 'HELP')
      (div {className: 'wireframe-global-nav-content-username'}, @props.username)
      (div {className: 'wireframe-global-nav-content-filename'}, @props.filename)
    )
