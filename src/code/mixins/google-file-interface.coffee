GoogleDriveIO = require '../utils/google-drive-io'
tr = require '../utils/translate'

module.exports =
  getInitialAppViewState: (subState) ->
    mixinState =
      gapiLoaded: false
      fileId: null
      action: tr "~FILE.CHECKING_AUTH"
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
    if confirm tr "~FILE.CONFIRM"
      @props.linkManager.deleteAll()
      @setState
        fileId: null

  openFile: ->
    @googleDrive.filePicker (err, fileSpec) =>
      if err
        alert err
      else if fileSpec
        @setState action: tr "~FILE.DOWNLOADING"
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
    filename = $.trim ((prompt (tr "~FILE.FILENAME"), @props.filename) or '')
    if filename.length > 0
      @props.linkManager.setFilename filename
    return filename

  saveFile: ->
    filename = @rename()
    if filename.length > 0
      @setState action: tr "~FILE.UPLOADING"

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
          @props.linkManager.setSaved()

  revertToOriginal: ->
    if confirm tr "~FILE.CONFIRM_ORIGINAL_REVERT"
      @props.linkManager.revertToOriginal()

  revertToLastSave: ->
    if confirm tr "~FILE.CONFIRM_LAST_SAVE_REVERT"
      @props.linkManager.revertToLastSave()
