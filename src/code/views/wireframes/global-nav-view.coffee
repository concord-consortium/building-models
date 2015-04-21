{div, i, span} = React.DOM

Dropdown = React.createFactory require './dropdown-view'
module.exports = React.createClass

  displayName: 'GlobalNav'

  render: ->
    options = [
      name: 'New…',
      action: @showNew,
    ,
      name: 'Open…',
      action: @open,
    ,
      name: 'Save…',
      action: @save
    ,
      name: 'Save a Copy…',
      action: @saveCopy,
    ,
      name: 'Advanced Settings …',
      action: @advancedSettings,
    ,
      name: 'Rename',
      action: @rename
     ]

    (div {className: 'wireframe-global-nav wireframe-non-placeholder'},
      (Dropdown {anchor: @props.filename, items: options, className:'wireframe-global-nav-content-filename'})
      (div {className: 'wireframe-global-nav-name-and-help'},
        (span {className: 'mockup-only'}, @props.username),
        (span {className: 'mockup-only'}, "HELP")
      )
    )
