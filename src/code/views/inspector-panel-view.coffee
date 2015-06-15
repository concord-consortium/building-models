NodeInspectorView = React.createFactory require './node-inspector-view'
LinkInspectorView = React.createFactory require './link-inspector-view'
PaletteInspectorView = React.createFactory require './palette-inspector-view'
LinkValueInspectorView = React.createFactory require './link-value-inspector-view'
NodeValueInspectorView = React.createFactory require './node-value-inspector-view'
LinkRelationInspectorView = React.createFactory require './relation-inspector-view'
NodeRelationInspectorView = React.createFactory require './relation-inspector-view'

{div, i, span} = React.DOM

ToolButton = React.createFactory React.createClass
  displayName: 'toolButton'
  render: ->
    name = @props.name
    onClick = =>
      @props.onClick(@props.name) if @props.onClick

    classes = "icon-#{name} tool-button"
    classes = "#{classes} selected" if @props.selected
    classes = "#{classes} disabled" if @props.disabled
    (div {className: classes, onClick: onClick})

ToolPanel = React.createFactory React.createClass
  displayName: 'toolPanel'

  buttonData: [
      {name: "plus",  shows: "add"}
      {name: "brush", shows: "design"}
      {name: "ruler", shows: "value"}
      {name: "curve", shows: "relations"}
    ]

  buttonProps: (button) ->
    name: button.name
    shows: button.shows
    selected: @props.nowShowing is button.shows
    onClick: =>
      @select button.name

  select: (name) ->
    button = _.find @buttonData, {name: name}
    if button
      if @props.nowShowing isnt button.shows
        @props.onNowShowing(button.shows)
      else
        @props.onNowShowing(null)

  render: ->
    buttonsView = _.map @buttonData, (button) =>
      props = @buttonProps(button)
      (ToolButton props)

    (div {className: 'tool-panel'}, buttonsView)



module.exports = React.createClass

  displayName: 'InspectorPanelView'

  getInitialState: ->
    nowShowing: null

  setShowing: (item) ->
    @setState(nowShowing: item)


  renderPaletteInspector: ->
    (PaletteInspectorView {
      palette: @props.palette,
      toggleImageBrowser: @props.toggleImageBrowser,
      linkManager: @props.linkManager
    })

  renderDesignInspector: ->
    if @props.node
      (NodeInspectorView {
        node: @props.node
        onNodeChanged: @props.onNodeChanged
        onNodeDelete: @props.onNodeDelete
        palette: @props.palette
      })
    else if @props.link
      (LinkInspectorView {link: @props.link, onLinkChanged: @props.onLinkChanged})

  renderValueInspector: ->
    if @props.node
      (NodeValueInspectorView {node: @props.node, linkManager: @props.linkManager})
    else if @props.link
      (LinkValueInspectorView {link:@props.link})

  renderRelationInspector: ->
    if @props.node
      (NodeRelationInspectorView {node:@props.node})
    else if @props.link
      (LinkRelationInspectorView {link:@props.link})


  renderInspectorPanel: ->
    view = switch @state.nowShowing
      when 'add'       then @renderPaletteInspector()
      when 'design'    then @renderDesignInspector()
      when 'value'     then @renderValueInspector()
      when 'relations' then @renderRelationInspector()

    (div {className: "inspector-panel-content"},
      view
    )

  render: ->
    className = "inspector-panel"
    unless @state.nowShowing
      className = "#{className} collapsed"

    (div {className: className},
      (ToolPanel {node: @props.node, link: @props.link, nowShowing: @state.nowShowing, onNowShowing: @setShowing})
      @renderInspectorPanel()
    )
