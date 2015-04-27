NodeEditView = React.createFactory require './node-edit-view'
LinkEditView = React.createFactory require './link-edit-view'
PaletteInspectorView = React.createFactory require './palette-inspector-view'

{div, i} = React.DOM

module.exports = React.createClass

  displayName: 'InspectorPanelView'

  getInitialState: ->
    expanded: true

  collapse: ->
    @setState {expanded: false}

  expand: ->
    @setState {expanded: true}

  render: ->
    className = "inspector-panel"
    action = @collapse
    if @state.expanded is false
      className = "#{className} collapsed"
      action = @expand

    (div {className: className},
      (div {className: 'inspector-panel-toggle', onClick: action})
      (div {className: "inspector-panel-content"},
        if @props.node
          (NodeEditView {node: @props.node, onNodeChanged: @props.onNodeChanged, protoNodes: @props.protoNodes})
        else if @props.link
          (LinkEditView {link: @props.link, onLinkChanged: @props.onLinkChanged})
        else
          (PaletteInspectorView {protoNodes: @props.protoNodes, toggleImageBrowser: @props.toggleImageBrowser})
      )
    )
