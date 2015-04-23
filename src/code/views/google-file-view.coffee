
{div, label, input, button} = React.DOM

module.exports = React.createClass
  mixins: [require '../mixins/google-file-interface']

  displayName: 'GoogleFileView'

  getInitialState: ->
    @getInitialAppViewState {}

  componentDidMount: ->
    @createGoogleDrive()


  render: ->
    (div {className: 'file-dialog-view'},
      (div {className: 'filename'}, if @state.action then @state.action else @props.filename),
      (div {className: 'buttons'},
        (button {onClick: @newFile}, 'New'),
        (button {onClick: @openFile, disabled: not @state.gapiLoaded}, 'Open'),
        (button {onClick: @saveFile, disabled: not @state.gapiLoaded}, 'Save')
      )
    )


