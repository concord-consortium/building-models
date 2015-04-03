GoogleDriveIO = require '../utils/google-drive-io'

{div, label, input, button} = React.DOM

module.exports = React.createClass

  displayName: 'GoogleFileView'
  
  getInitialState: ->
    filename: 'model'
    authStatus: 'unknown'
    
  componentDidMount: ->
    googleDrive = new GoogleDriveIO()
    
    # wait for gapi to finish initing
    waitForGAPI = =>
      if gapi?.auth?.authorize
        @authorize true
      else
        setTimeout waitForGAPI, 10
    waitForGAPI()
    
  saveToGDrive: ->
    googleDrive = new GoogleDriveIO()
    filename = @state.filename

    log.info "Proposing to save to '#{filename}'"
    if not filename or filename.length is 0
      filename = 'model'
    if not /\.json$/.test filename
      filename += '.json'
      
    log.info "Saving to '#{filename}'"
    googleDrive.upload {fileName: filename, mimeType: 'application/json'}, @props.linkManager.toJsonString()

  authorize: (immediate) ->
    googleDrive = new GoogleDriveIO()
    googleDrive.authorize immediate, (token) =>
      if token and not token.error
        @setState authStatus: 'authorized'
      else
        @setState authStatus: 'unauthorized'
        console.error "Google Drive Authorization failed: #{token?.error or 'Unknown error'}"
        
  changeFilename: (e) ->
    log.info "Changing filename: #{e.target.value}"
    # TODO: Maybe move the filename property up to be state in App.
    @setState filename: e.target.value

  render: ->
    switch @state.authStatus
      when 'authorized'
        (div {className: 'file-dialog-view'},
          (label {}, 'Filename:')
          (input {type: 'text', onChange: @changeFilename, value: @state.fileName, id: 'filename'})
          (button {id: 'send', onClick: @saveToGDrive}, 'Save to Google Drive')
        )
      when 'unauthorized'
        (div {className: 'file-dialog-view'},
          (button {id: 'authorize', onClick: (=> @authorize false)}, 'Authorize for Google Drive')
        )
      else
        null
      

