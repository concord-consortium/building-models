GoogleDriveIO = require '../utils/google-drive-io'

module.exports =
  getInitialAppViewState: (subState) ->
    mixinState =
      gapiLoaded: false
      fileId: null
      action: 'Checking authorization...'
    _.extend mixinState, subState

  createGoogleDrive: ->
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

  rename: ->
    filename = $.trim ((prompt 'Filename', @props.filename) or '')
    if filename.length > 0
      @props.linkManager.setFilename filename
    return filename

  saveFile: ->
    filename = @rename()
    if filename.length > 0
      @setState action: 'Uploading...'

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
