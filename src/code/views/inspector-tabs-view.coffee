{div} = React.DOM
module.exports = React.createClass

  displayName: 'InspectorTabsView'

  render: ->
    (div {className: 'inspector-tabs'},
      for tab in @props.tabs
        if tab is @props.selected
          (div {key: tab, className: 'inspector-tab selected'},tab)
        else
          (div {key: tab, className: 'inspector-tab'},tab)

    )
