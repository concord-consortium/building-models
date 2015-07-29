PaletteManager = require "../models/palette-manager"

module.exports =
  getInitialState: ->
    palette: PaletteManager.store.palette
    selectedPaletteItem: PaletteManager.store.selectedPaletteItem
    selectedPaletteIndex: PaletteManager.store.selectedPaletteIndex
    selectedPaletteImage: PaletteManager.store.selectedPaletteImage
    imageMetadata: PaletteManager.store.imageMetadata

  componentDidMount: ->
    PaletteManager.store.listen @onPaletteChange

  onPaletteChange: (status) ->
    @setState
      palette: status.palette
      selectedPaletteItem: status.selectedPaletteItem
      selectedPaletteIndex: status.selectedPaletteIndex
      selectedPaletteImage: status.selectedPaletteImage
      imageMetadata: status.imageMetadata
