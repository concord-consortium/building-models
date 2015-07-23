ProtoNodeView  = React.createFactory require './proto-node-view'
PaletteManager = require "../models/palette-manager"

{div} = React.DOM

module.exports = React.createClass

  displayName: 'NodeWell'

  componentDidMount: ->
    PaletteManager.store.listen @onPaletteChange

  onPaletteChange: (status) ->
    @setState palette: status.palette

  getInitialState: ->
    nodes: []
    palette: PaletteManager.store.palette
    collapsed: true

  collapse: ->
    @setState collapsed: true
  expand: ->
    @setState collapsed: false
  toggle: ->
    if @state.collapsed
      @expand()
    else
      @collapse()
  render: ->

    topNodePaletteClass    = 'top-node-palette'
    topNodeTabPaletteClass = 'top-node-palette-tab'
    if @state.collapsed
      topNodePaletteClass    = 'top-node-palette collapsed'
      topNodeTabPaletteClass = 'top-node-palette-tab collapsed'
    (div {className: 'top-node-palette-wrapper'},
      (div {className: topNodePaletteClass},
        (div {className: 'node-well'},
          for node, i in @state.palette
            (ProtoNodeView {key: i, image: node.image, title: node.title})
        )
      )
      (div {className: topNodeTabPaletteClass, onClick: @toggle})
    )
