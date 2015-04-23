{div, i, span, ul, li} = React.DOM


module.exports = React.createClass

  displayName: 'Dropdown'
  getInitialState: ->
    showingMenu: false
    timeout: null
  blur: ->
    @unblur()
    timeout = setTimeout ( => @setState {showingMenu: false} ), 500
    @setState {timeout: timeout}
  unblur: ->
    if @state.timeout
      clearTimeout(@state.timeout)
    @setState {timeout: null}

  select: (item) ->
    nextState = (not @state.showingMenu)
    @setState {showingMenu: nextState}
    if item and item.action
      item.action()
    else if item and item.name
      alert "no action for #{item.name}"
  render: ->
    showing = @state.showingMenu
    menuClass = 'menu-hidden'
    select = (item) =>
      ( => @select(item))
    if showing
      menuClass = 'menu-showing'
    (div {className: 'menu'},
      (span {className: 'menu-anchor', onClick: => @select(null)},
        @props.anchor
        (i {className: 'fa fa-caret-down'})
      )
      (div {className: menuClass, onMouseLeave: @blur, onMouseEnter: @unblur},
        (ul {},
          for item in @props.items
            className = "menuItem"
            if (not item.action)
              className = "#{className} disabled"
            (li {className: className, onClick: select(item) }, item.name)
        )
      )
    )
