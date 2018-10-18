DropZone = React.createFactory require './dropzone-view'
ImageDialogStore = require '../stores/image-dialog-store'

tr = require '../utils/translate'

{div, p, input} = React.DOM

module.exports = React.createClass
  displayName: 'MyComputer'

  mixins: [ ImageDialogStore.mixin, require '../mixins/image-dialog-view']

  previewImage: (e) ->
    e.preventDefault()
    files = @refs.file.files
    if files.length is 0
      alert tr "~IMAGE-BROWSER.PLEASE_DROP_FILE"
    else if @hasValidImageExtension files[0].name
      title = (files[0].name.split '.')[0]
      reader = new FileReader()
      reader.onload = (e) =>
        @imageSelected
          image: e.target.result
          title: title
          metadata:
            title: title
            source: 'external'
      reader.readAsDataURL files[0]

  render: ->
    (div {className: 'my-computer-dialog'},
      if @state.selectedImage
        @renderPreviewImage()
      else
        (div {},
          (DropZone {header: (tr "~IMAGE-BROWSER.DROP_IMAGE_FROM_DESKTOP"), dropped: @imageDropped}),
          (p {}, (tr "~IMAGE-BROWSER.CHOOSE_FILE"))
          (p {}, (input {ref: 'file', type: 'file', onChange: @previewImage}))
        )
    )
