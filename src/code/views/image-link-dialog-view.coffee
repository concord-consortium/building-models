DropZone = React.createFactory require './dropzone-view'

tr = require '../utils/translate'

{div, p, input} = React.DOM

module.exports = React.createClass
  displayName: 'Link'

  mixins: [require '../mixins/image-dialog-view']

  getInitialState: ->
    @getInitialImageDialogViewState()

  previewImage: (e) ->
    e.preventDefault()
    url = $.trim @refs.url.getDOMNode().value
    if url.length is 0
      alert tr "~IMAGE-BROWSER.PLEASE_DROP_IMAGE"
    else if @hasValidImageExtension url
      @imageSelected
        image: url
        metadata:
          source: 'external'
          link: url

  render: ->
    (div {className: 'link-dialog'},
      if @state.selectedImage
        @renderPreviewImage()
      else
        (div {},
          (DropZone {header: (tr "~IMAGE-BROWSER.DROP_IMAGE_FROM_BROWSER"), dropped: @imageDropped}),
          (p {}, (tr "~IMAGE-BROWSER.TYPE_OR_PASTE_LINK"))
          (p {}, (tr "~IMAGE-BROWSER.IMAGE_URL"), (input {ref: 'url', type: 'text'}))
          (p {}, (input {type: 'submit', onClick: @previewImage, value: (tr "~IMAGE-BROWSER.PREVIEW_IMAGE")}))
        )
    )
