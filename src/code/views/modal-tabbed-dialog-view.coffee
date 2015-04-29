ModalDialog = React.createFactory require './modal-dialog-view'
{div, ul, li, a} = React.DOM

class TabInfo
  constructor: (settings={}) ->
    {@label, @component} = settings

Tab = React.createFactory React.createClass

  displayName: 'ModalTabbedDialogTab'

  clicked: (e) ->
    e.preventDefault()
    @props.onSelected @props.index

  render: ->
    (li {className: (if @props.selected then 'tab-selected' else ''), onClick: @clicked}, @props.label)

module.exports = React.createClass

  displayName: 'ModalTabbedDialog'

  getInitialState: ->
    selectedTabIndex: 0

  statics:
    Tab: (settings) -> new TabInfo settings

  selectedTab: (index) ->
    @setState selectedTabIndex: index

  render: ->
    tabs = for tab, index in @props.tabs
      (Tab {label: tab.label, key: index, index: index, selected: index is @state.selectedTabIndex, onSelected: @selectedTab})
    (ModalDialog {title: @props.title, close: @props.close},
      (div {className: 'modal-dialog-workspace-tabs'},
        (ul {}, tabs)
      )
      (div {className: 'modal-dialog-workspace-tab-component'},
        for tab, index in @props.tabs
          (div {style: {display: if index is @state.selectedTabIndex then 'block' else 'none'}}, tab.component)
      )
    )
