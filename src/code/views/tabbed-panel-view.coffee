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
    if @props.selectedTabIndex isnt nextProps.selectedTabIndex
      @selectedTab nextProps.selectedTabIndex

  statics:
    Tab: (settings) -> new TabInfo settings

  selectedTab: (index) ->
    @setState selectedTabIndex: index

  renderTab: (tab, index) ->
    (Tab
      label: tab.label
      key: index
      index: index
      defined: tab.defined
      selected: (index is @state.selectedTabIndex)
      onSelected: @selectedTab
    )

  renderTabs: ->
    (div {className: 'workspace-tabs'},
      (ul {}, (@renderTab(tab,index) for tab, index in @props.tabs))
    )


  renderSelectedPanel: ->
    (div {className: 'workspace-tab-component'},
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
    (div {className: "tabbed-panel"},
      @renderTabs()
      @renderSelectedPanel()
    )
