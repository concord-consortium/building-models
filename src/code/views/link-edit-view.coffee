{div, h2, button, label, input} = React.DOM

palettes = [
  ['#4D6A6D','#798478', "#A0A083", "#C9ADA1", "#EAE0CC"],
  ['#351431','#775253', "#BDC696", "#D1D3C4", "#DFE0DC"],
  ['#D6F49D','#EAD637', "#CBA328", "#230C0F", "#A2D3C2"]
]
palette = palettes[2]

module.exports = React.createClass

  displayName: 'LinkEditView'

  notifyChange: (title, color, deleted) ->
    @props.onLinkChanged? @props.link, title, color, !!deleted

  changeTitle: (e) ->
    @notifyChange e.target.value, @props.link.color

  deleteLink: ->
    @notifyChange @props.link.title, @props.link.color, true

  pickColor: (e) ->
    @notifyChange @props.link.title, $(e.target).css('background-color')

  render: ->
    if this.props.link
      (div {className: 'link-edit-view'},
        (h2 {}, @props.link.title)
        (div {className: 'edit-row'},
          (button {type: 'button', className: 'delete', onClick: @deleteLink}, 'delete this link')
        )
        (div {className: 'edit-row'},
          (label {name: 'title'}, 'Title')
          (input {type: 'text', name: 'title', value: @props.link.title, onChange: @changeTitle})
        )
        (div {className: 'edit-row'},
          (label {name: 'color'}, 'Color')
          for colorCode, i in palette
            (div {className: 'colorChoice', key: i, style: {backgroundColor: colorCode}, onTouchEnd: @pickColor, onClick: @pickColor})
        )
      )
    else
      (div {className: 'link-edit-view hidden'})


