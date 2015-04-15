Placeholder = React.createFactory require './placeholder-view'
GlobalNav = React.createFactory require './global-nav-view'

{div} = React.DOM

module.exports = React.createClass

  displayName: 'WirefameApp'
  
  getInitialState: ->
    try
      iframed = window.self isnt window.top
    catch
      iframed = true
      
    iframed: iframed
    username: 'Jane Doe'
    filename: 'Untitled Model'

  render: ->
    (div {className: 'wireframe-app'},
      (if not @state.iframed then (GlobalNav {filename: @state.filename, username: @state.username}) else null)
      (div {className: if @state.iframed then 'wireframe-iframed-workspace' else 'wireframe-workspace'},
        (Placeholder {label: 'Component Palette', className: 'wireframe-component-palette'})
        (Placeholder {label: 'Document Actions', className: 'wireframe-document-actions'})
        (Placeholder {label: 'Canvas', className: 'wireframe-canvas'})
        (Placeholder {label: 'Inspector Panel', className: 'wireframe-inspector-panel'})
      )
    )
