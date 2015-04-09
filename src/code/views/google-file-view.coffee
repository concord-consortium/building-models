GoogleDriveIO = require '../utils/google-drive-io'

{div, label, input, button} = React.DOM

module.exports = React.createClass

  displayName: 'GoogleFileView'

  getInitialState: ->
    gapiLoaded: false
    fileId: null
    action: 'Checking authorization...'

  componentDidMount: ->
    @googleDrive = new GoogleDriveIO()

    # wait for gapi to finish initing
    waitForAuthCheck = =>
      if gapi?.auth?.authorize
        @googleDrive.authorize true, =>
          @setState
            gapiLoaded: true
            action: null
      else
        setTimeout waitForAuthCheck, 10
    waitForAuthCheck()

  newFile: ->
    if confirm 'Are you sure?'
      @props.linkManager.deleteAll()
      @setState
        fileId: null

  openFile: ->
    @googleDrive.filePicker (err, fileSpec) =>
      if err
        alert err
      else if fileSpec
        @setState action: 'Downloading...'
        @googleDrive.download fileSpec, (err, data) =>
          if err
            alert err
            @setState action: null
          else
            @setState
              fileId: fileSpec.id
              action: null
            @props.linkManager.deleteAll()
            @props.linkManager.loadData data

  saveFile: ->
    filename = $.trim ((prompt 'Filename', @props.filename) or '')
    if filename.length > 0
      @setState action: 'Uploading...'
      
      # set the filename before serializing so it is saved in the data
      @props.linkManager.setFilename filename
      
      # if this is a save of an existing file with the same name use the fileid
      fileId = if filename is @props.filename then @state.fileId else null
      @googleDrive.upload {fileName: filename, fileId: fileId}, @props.getData(), (err, fileSpec) =>
        if err
          alert err
          @setState action: null
        else
          @setState
            fileId: fileSpec.id
            action: null

  render: ->
    (div {className: 'file-dialog-view'},
      (div {className: 'filename'}, if @state.action then @state.action else @props.filename),
      (div {className: 'buttons'},
        (button {onClick: @newFile}, 'New'),
        (button {onClick: @openFile, disabled: not @state.gapiLoaded}, 'Open'),
        (button {onClick: @saveFile, disabled: not @state.gapiLoaded}, 'Save')
      )
    )


