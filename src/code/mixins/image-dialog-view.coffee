PreviewImage = React.createFactory require '../views/preview-image-dialog-view'
hasValidImageExtension = require '../utils/has-valid-image-extension'
PaletteManager = require '../models/palette-manager'

resizeImage = require '../utils/resize-image'

module.exports =

  getInitialImageDialogViewState: (subState) ->
    mixinState =
      selectedImage: null
    _.extend mixinState, subState

  imageSelected: (imageInfo) ->
    PaletteManager.actions.setImageMetadata imageInfo.image, imageInfo.metadata
    @setState selectedImage: imageInfo

  imageDropped: (imageInfo) ->
    @imageSelected imageInfo

  addImage: (imageInfo) ->
    if imageInfo and not @props.inPalette imageInfo
      resizeImage imageInfo.image, (dataUrl) =>
        imageInfo.image = dataUrl
        @props.addToPalette imageInfo
    @setState selectedImage: null

  hasValidImageExtension: (imageName) ->
    hasValidImageExtension imageName

  renderPreviewImage: ->
    (PreviewImage {imageInfo: @state.selectedImage, addImage: @addImage, linkManager: @props.linkManager})
