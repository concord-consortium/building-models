{div} = React.DOM

module.exports = React.createClass

  displayName: 'WirefameApp'
  
  getInitialState: ->
    try
      iframed = window.self isnt window.top
    catch
      iframed = true
    iframed: iframed

  render: ->
    (div {className: 'wireframe-app'}, "Building Models #{if @state.iframed then 'iFramed' else 'Standalone'} Wireframe Placeholder")
