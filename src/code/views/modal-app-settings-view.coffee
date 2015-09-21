ModalDialog         = React.createFactory require './modal-dialog-view'
AppSettingsActions  = require('../stores/app-settings-store').actions
tr                  = require '../utils/translate'

{div, ul, li, a, input, label, span, button} = React.DOM

module.exports = React.createClass

  displayName: 'ModalAppSettings'

  handleCapNodeValuesChange: (e) ->
    AppSettingsActions.capNodeValues(e.target.checked)

  handleDiagramOnly: (e) ->
    AppSettingsActions.diagramOnly(e.target.checked)

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
            (div {},
              (input {type: 'checkbox', value: 'cap', checked: @props.diagramOnly, onChange: @handleDiagramOnly})
              (label {}, tr '~APP_SETTINGS.DIAGRAM_ONLY')
            )
            (div {className: 'buttons'},
              (button {name: 'close', value: 'Close', onClick: @props.onClose}, 'Close')
            )
          )
        )
    )
