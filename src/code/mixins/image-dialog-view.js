PreviewImage = React.createFactory require '../views/preview-image-dialog-view'
hasValidImageExtension = require '../utils/has-valid-image-extension'
ImageDialogStore = require '../stores/image-dialog-store'


module.exports =

  getInitialImageDialogViewState: (subState) ->
    subState

  imageSelected: (imageInfo) ->
    ImageDialogStore.actions.update imageInfo

  imageDropped: (imageInfo) ->
    @imageSelected imageInfo

  hasValidImageExtension: (imageName) ->
    hasValidImageExtension imageName

  renderPreviewImage: ->
    (PreviewImage {imageInfo: @props.selectedImage })
