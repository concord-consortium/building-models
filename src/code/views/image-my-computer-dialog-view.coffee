DropZone = React.createFactory require './dropzone-view'

tr = require '../utils/translate'

{div, p, input} = React.DOM

module.exports = React.createClass
  displayName: 'MyComputer'

  mixins: [require '../mixins/image-dialog-view']

  getInitialState: ->
    @getInitialImageDialogViewState()

  previewImage: (e) ->
    e.preventDefault()
    files = @refs.file.getDOMNode().files
    if files.length is 0
      alert tr "~IMAGE-BROWSER.PLEASE_DROP_FILE"
    else if @hasValidImageExtension files[0].name
      reader = new FileReader()
      reader.onload = (e) =>
        @imageSelected
          image: e.target.result
          metadata:
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
