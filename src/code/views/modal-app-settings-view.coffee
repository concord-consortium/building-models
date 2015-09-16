ModalDialog         = React.createFactory require './modal-dialog-view'
AppSettingsActions  = require('../stores/app-settings-store').actions
tr                  = require '../utils/translate'

{div, ul, li, a, input, label, span, button} = React.DOM

module.exports = React.createClass

  displayName: 'ModalAppSettings'

  handleCapNodeValuesChange: (e) ->
    AppSettingsActions.capNodeValues(e.target.checked)

  render: ->
    (div {className:'modal-simple-popup'},
      if @props.showing
        title = tr '~APP_SETTINGS.TITLE'
        (ModalDialog {title: title, close: @props.onClose},
          (div {className: "simple-popup-panel"},
            (div {},
              (input {type: 'checkbox', value: 'cap', checked: @props.capNodeValues, onChange: @handleCapNodeValuesChange})
              (label {}, tr '~APP_SETTINGS.CAP_VALUES')
            )
            (div {className: 'buttons'},
              (button {name: 'close', value: 'Close', onClick: @props.onClose}, 'Close')
            )
          )
        )
    )
