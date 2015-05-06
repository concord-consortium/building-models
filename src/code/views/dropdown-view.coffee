{div, i, span, ul, li} = React.DOM

DropdownItem = React.createFactory React.createClass

  displayName: 'DropdownItem'

  clicked: ->
    @props.select @props.item

  render: ->
    className = "menuItem #{if not @props.item.action then 'disabled' else ''}"
    (li {key: @props.item.name, className: className, onClick: @clicked }, @props.item.name)

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

  render: ->
    menuClass = if @state.showingMenu then 'menu-showing' else 'menu-hidden'
    select = (item) =>
      ( => @select(item))
    (div {className: 'menu'},
      (span {className: 'menu-anchor', onClick: => @select(null)},
        @props.anchor
        (i {className: 'fa fa-caret-down'})
      )
      (div {className: menuClass, onMouseLeave: @blur, onMouseEnter: @unblur},
        (ul {},
          (DropdownItem {key: item.name, item: item, select: @select}) for item in @props.items
        )
      )
    )
