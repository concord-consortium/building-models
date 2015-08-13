ImageMetadata = React.createFactory require './image-metadata-view'
ImageManger   = require "../stores/image-dialog-store"
PaletteStore  = require "../stores/palette-store"

tr = require '../utils/translate'

{div, button, img, i, a} = React.DOM
module.exports = React.createClass
  displayName: 'ImageSearchResult'

  cancel: (e) ->
    e.preventDefault()
    ImageManger.actions.cancel()

  addImage: ->
    PaletteStore.actions.addToPalette @props.imageInfo

  render: ->
    (div {},
      (div {className: 'header'}, tr '~IMAGE-BROWSER.PREVIEW')
      (div {className: 'preview-image'},
        (img {src: @props.imageInfo?.image})
        (a {href: '#', onClick: @cancel},
          (i {className: "fa fa-close"})
          'cancel'
        )
      )
      (div {className: 'preview-add-image'},
        (button {onClick: @addImage}, tr '~IMAGE-BROWSER.ADD_IMAGE')
      )
      if @props.imageInfo?.metadata
        (div {className: 'preview-metadata'},
          (ImageMetadata {metadata: @props.imageInfo.metadata, className: 'image-browser-preview-metadata'})
        )
    )
