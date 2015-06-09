{div, ul, li, a} = React.DOM

class TabInfo
  constructor: (settings={}) ->
    {@label, @component} = settings

Tab = React.createFactory React.createClass

  displayName: 'TabbedPanelTab'

  clicked: (e) ->
    e.preventDefault()
    @props.onSelected @props.index

  render: ->
    classname = if @props.selected then 'tab-selected' else ''
    (li {className: classname, onClick: @clicked}, @props.label)

module.exports = React.createClass

  displayName: 'TabbedPanelView'

  getInitialState: ->
    selectedTabIndex: 0

  statics:
    Tab: (settings) -> new TabInfo settings

  selectedTab: (index) ->
    @setState selectedTabIndex: index

  renderTab: (tab, index) ->
    (Tab
      label: tab.label
      key: index
      index: index
      selected: (index is @state.selectedTabIndex)
      onSelected: @selectedTab
    )

  renderTabs: ->
    (div {className: 'workspace-tabs'},
      (ul {}, @renderTab(tab,index) for tab, index in @props.tabs)
    )


  renderSelectedPanel: ->
    (div {className: 'workspace-tab-component'},
      for tab, index in @props.tabs
        (div {
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
