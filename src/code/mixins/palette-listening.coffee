PaletteManager = require "../models/palette-manager"

module.exports =
  getInitialState: ->
    palette: PaletteManager.store.palette

  componentDidMount: ->
    PaletteManager.store.listen @onPaletteChange

  onPaletteChange: (status) ->
    @setState palette: status.palette
