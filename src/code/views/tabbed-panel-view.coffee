{div, ul, li, a} = React.DOM

class TabInfo
  constructor: (settings={}) ->
    {@label, @component, @defined} = settings

Tab = React.createFactory React.createClass

  displayName: 'TabbedPanelTab'

  clicked: (e) ->
    e.preventDefault()
    @props.onSelected @props.index

  render: ->
    classname = if @props.defined then 'tab-link-defined' else ''
    if @props.selected then classname += ' tab-selected'
    (li {className: classname, onClick: @clicked}, @props.label)

module.exports = React.createClass

  displayName: 'TabbedPanelView'

  getInitialState: ->
    selectedTabIndex: @props.selectedTabIndex || 0

  componentWillReceiveProps: (nextProps) ->
    if @state.selectedTabIndex isnt nextProps.selectedTabIndex
      @selectedTab nextProps.selectedTabIndex

  statics:
    Tab: (settings) -> new TabInfo settings

  selectedTab: (index) ->
    @setState selectedTabIndex: index or 0

  onTabSelected: (index) ->
    if @props.onTabSelected
      @props.onTabSelected index
    else
      @selectedTab index

  renderTab: (tab, index) ->
    (Tab
      label: tab.label
      key: index
      index: index
      defined: tab.defined
      selected: (index is @state.selectedTabIndex)
      onSelected: @onTabSelected
    )

  renderTabs: (clientClass) ->
    (div {className: "workspace-tabs#{clientClass}"},
      (ul {}, (@renderTab(tab,index) for tab, index in @props.tabs))
    )


  renderSelectedPanel: (clientClass) ->
    (div {className: "workspace-tab-component#{clientClass}"},
      for tab, index in @props.tabs
        (div {
          key: index
          style:
            display: if index is @state.selectedTabIndex then 'block' else 'none'
          },
          tab.component
        )
    )

  render: ->
    clientClass = if @props.clientClass then ' ' + @props.clientClass else ''
    (div {className: "tabbed-panel#{clientClass}"},
      @renderTabs(clientClass)
      @renderSelectedPanel(clientClass)
    )
