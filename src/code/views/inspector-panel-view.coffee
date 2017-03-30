NodeInspectorView = React.createFactory require './node-inspector-view'
LinkInspectorView = React.createFactory require './link-inspector-view'
LinkValueInspectorView = React.createFactory require './link-value-inspector-view'
NodeValueInspectorView = React.createFactory require './node-value-inspector-view'
LinkRelationInspectorView = React.createFactory require './relation-inspector-view'
NodeRelationInspectorView = React.createFactory require './relation-inspector-view'
SimulationInspectorView   = React.createFactory require './simulation-inspector-view'

InspectorPanelStore  = require "../stores/inspector-panel-store"

{div, i, span} = React.DOM

ToolButton = React.createFactory React.createClass
  displayName: 'toolButton'
  render: ->
    name = @props.name
    onClick = =>
      @props.onClick(@props.name) if @props.onClick

    classes = "icon-codap-#{name} tool-button"
    classes = "#{classes} selected" if @props.selected
    classes = "#{classes} disabled" if @props.disabled
    (div {className: classes, onClick: onClick})

ToolPanel = React.createFactory React.createClass
  displayName: 'toolPanel'

  buttonData: [
      {name: "styles", simple: true, shows: "design",'enabled': ['node','link'] }
      {name: "values", simple: false, shows: "value", 'enabled': ['node'] }
      {name: "qualRel", simple: false, shows: "relations",'enabled': ['dependent-node']}
      {name: "options",  simple: true, shows: "simulation", 'enabled': ['nothing'] }
    ]

  isDisabled: (button) ->
    return false if _.includes(button.enabled, 'nothing')
    return false if _.includes(button.enabled, 'node') and @props.node
    return false if _.includes(button.enabled, 'dependent-node') and @props.node?.isDependent()
    return false if _.includes(button.enabled, 'link') and @props.link
    return true

  buttonProps: (button) ->
    props =
      name:     button.name
      shows:    button.shows
      selected: false
      disabled: @isDisabled(button)

    unless @isDisabled(button)
      props.onClick = =>
        @select button.name
      props.selected = @props.nowShowing is button.shows

    props

  select: (name) ->
    button = _.find @buttonData, {name: name}
    if button
      if @props.nowShowing isnt button.shows
        @props.onNowShowing(button.shows)
      else
        @props.onNowShowing(null)

  render: ->
    buttons = @buttonData.slice 0
    if @props.diagramOnly
      buttons = _.filter buttons, (button) -> button.simple
    buttonsView = _.map buttons, (button, i) =>
      props = @buttonProps(button)
      props.key = i
      (ToolButton props)

    (div {className: 'tool-panel'}, buttonsView)

module.exports = React.createClass

  displayName: 'InspectorPanelView'

  mixins: [ InspectorPanelStore.mixin ]

  renderSimulationInspector: ->
    (SimulationInspectorView {})

  renderDesignInspector: ->
    if @props.node
      (NodeInspectorView {
        node: @props.node
        onNodeChanged: @props.onNodeChanged
        onNodeDelete: @props.onNodeDelete
        palette: @props.palette
      })
    else if @props.link
      (LinkInspectorView {link: @props.link,  graphStore: @props.graphStore})

  renderValueInspector: ->
    if @props.node
      (NodeValueInspectorView {node: @props.node, graphStore: @props.graphStore})
    else if @props.link
      (LinkValueInspectorView {link:@props.link})

  renderRelationInspector: ->
    if @props.node?.isDependent()
      (NodeRelationInspectorView {node:@props.node, graphStore: @props.graphStore})
    else if @props.link
      (LinkRelationInspectorView {link:@props.link, graphStore: @props.graphStore})
    else
      return null

  # 2015-12-09 NP: Deselection makes inpector panel hide http://bit.ly/1ORBBp2
  # 2016-03-15 SF: Changed this to a function explicitly called when selection changes
  nodeSelectionChanged: ->
    unless (@props.node or @props.link)
      InspectorPanelStore.actions.closeInspectorPanel()

  renderInspectorPanel: ->
    view = switch @state.nowShowing
      when 'simulation' then @renderSimulationInspector()
      when 'design'     then @renderDesignInspector()
      when 'value'      then @renderValueInspector()
      when 'relations'  then @renderRelationInspector()

    (div {className: "inspector-panel-content"},
      view
    )

  render: ->
    className = "inspector-panel"
    unless @state.nowShowing
      className = "#{className} collapsed"

    (div {className: className},
      (ToolPanel
        node: @props.node
        link: @props.link
        nowShowing: @state.nowShowing
        onNowShowing: InspectorPanelStore.actions.openInspectorPanel
        diagramOnly: @props.diagramOnly
      )
      @renderInspectorPanel()
    )
