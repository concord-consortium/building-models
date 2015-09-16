ModalDialog         = React.createFactory require './modal-dialog-view'
tr                  = require '../utils/translate'

{div, ul, li, a, input, label, span, button} = React.DOM

module.exports = React.createClass

  displayName: 'ModalGoogleSave'

  onSave: ->
    # name = $.trim @refs.fileName.getDOMNode().value
    @props.onRename? @state.filename
    @props.setIsPublic? @state.isPublic
    @props.onSave()
    @props.onClose()

  getInitialState: ->
    filename: @props.filename
    isPublic: @props.isPublic

  handleFilenameChange: (e) ->
    @setState filename: e.target.value

  handlePublicChange: (e) ->
    @setState isPublic: e.target.checked

  render: ->
    (div {className:'modal-simple-popup'},
      if @props.showing
        title = tr "~GOOGLE_SAVE.TITLE"
        (ModalDialog {title: title, close: @props.onClose},
          (div {className: "simple-popup-panel label-text"},
            (div {className: 'filename'},
              (label {}, 'Name')
              (input {
                name: "fileName"
                ref: "fileName"
                value: @state.filename
                type: 'text',
                placeholder: tr '~MENU.UNTITLED_MODEL'
                onChange: @handleFilenameChange
              })
            )
            (div {className: 'make-public'},
              (input {type: 'checkbox', value: 'public', checked: @state.isPublic, onChange: @handlePublicChange})
              (label {}, tr '~GOOGLE_SAVE.MAKE_PUBLIC')
            )
            (div {className: 'buttons'},
              (button {name: 'cancel', value: 'Cancel', onClick: @props.onClose}, 'Cancel')
              (button {name: 'save', value: 'Save', onClick: @onSave}, 'Save')
            )
          )
        )
    )
