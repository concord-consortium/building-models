NodeEditView= React.createFactory require '../node-edit-view'
LinkEditView= React.createFactory require '../link-edit-view'

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
    className = "wireframe-inspector-panel"
    action = @collapse
    chevron = 'fa fa-chevron-right'
    if @state.expanded is false
      className = "#{className} inspector-panel-collapsed"
      action = @expand
      chevron = 'fa fa-chevron-left'

    (div {className: className},
      (div {className: 'inspector-panel-toggle', onClick: action},
        (i className: chevron)
      )
      (div {className: "inspector-panel-content"},
        (NodeEditView {node: @props.node, onNodeChanged: @props.onNodeChanged, protoNodes: @props.protoNodes})
        (LinkEditView {link: @props.link, onLinkChanged: @props.onLinkChanged})
      )
    )
