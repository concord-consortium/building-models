{div} = React.DOM
module.exports = React.createClass

  displayName: 'InspectorTabsView'

  render: ->
    (div {className: 'inspector-tabs'},
      for tab in @props.tabs
        if tab is @props.selected
          (div {className: 'inspector-tab selected'},tab)
        else
          (div {className: 'inspector-tab'},tab)

    )
