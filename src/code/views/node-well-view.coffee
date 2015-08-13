PaletteInspectorView  = React.createFactory require './palette-inspector-view'
PaletteStore = require '../stores/palette-store'
{div} = React.DOM

module.exports = React.createClass

  displayName: 'NodeWell'

  mixins: [ PaletteStore.mixin ]

  getInitialState: ->
    nodes: []
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
    topNodePaletteClass    = 'top-node-palette-wrapper'
    topNodeTabPaletteClass = 'top-node-palette-tab'
    if @state.collapsed
      topNodePaletteClass    = 'top-node-palette-wrapper collapsed'
      topNodeTabPaletteClass = 'top-node-palette-tab collapsed'
    (div {className: 'wrapperwrapper'},
      (div {className: topNodePaletteClass},
        (PaletteInspectorView {
          toggleImageBrowser: @props.toggleImageBrowser,
          linkManager: @props.linkManager
        })
      )
      (div {className: 'tab-wrapper'},
        (div {className: topNodeTabPaletteClass, onClick: @toggle})
      )
    )
