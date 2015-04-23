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
    if @state.expanded is false
      className = "#{className} inspector-panel-collapsed"
    (div {className: className},
      (div {className: 'inspector-panel-toggle'},
        if @state.expanded is true
          (i
            className: 'fa fa-chevron-right'
            onClick: @collapse
          )
        else
          (i
            className: 'fa fa-chevron-left'
            onClick: @expand
          )
      )
      (div {className: "inspector-panel-content"},
        (NodeEditView {node: @props.node, onNodeChanged: @props.onNodeChanged, protoNodes: @props.protoNodes})
        (LinkEditView {link: @props.selectedConnection, onLinkChanged: @props.onLinkChanged})
      )
    )
