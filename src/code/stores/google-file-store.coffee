GoogleDriveIO = require '../utils/google-drive-io'
GraphStore    = require './graph-store'
PaletteStore  = require './palette-store'

tr = require '../utils/translate'

GoogleFileActions = Reflux.createActions [
  "showSaveDialog", "newFile", "openFile",
  "rename", "setIsPublic", "saveFile", "close"
  "revertToOriginal", "revertToLastSave", "connectToApi"
  "loadAfterAuth"
]

stateFields = [
  'gapiLoaded', 'fileId', 'action', 'isPublic',
  'docLink', 'showingSaveDialog'
]


GoogleFileStore = Reflux.createStore
  listenables: [GoogleFileActions]

  init: ->
    @gapiLoaded        = false
    @fileId            = null
    @lastFilename      = null
    @action            = tr "~FILE.CHECKING_AUTH"
    @isPublic          = false
    @docLink           = null
    @showingSaveDialog = false


  notifyChange: ->
    @trigger
      gapiLoaded: @gapiLoaded
      fileId: @fileId
      action: @action
      isPublic: @isPublic
      docLink: @docLink
      showingSaveDialog: @showingSaveDialog

  onShowSaveDialog: ->
    @showingSaveDialog = true
    @notifyChange()

  onNewFile: ->
    if confirm tr "~FILE.CONFIRM"
      GraphStore.store.deleteAll()
      @fileId = null
      @notifyChange()

  onClose: ->
    @showingSaveDialog = false
    @notifyChange()

  onOpenFile: ->
    GoogleDrive.filePicker (err, fileSpec) =>
      if err
        alert err
      else if fileSpec
        @action = tr "~FILE.DOWNLOADING"
        GoogleDrive.download fileSpec, (err, data) =>
          if err
            alert err
            @action = null
          else
            @fileId = fileSpec.id
            @action = null
            @notifyChange()
            GraphStore.store.deleteAll()
            GraphStore.store.loadData data

  onRename: (filename) ->
    if filename.length > 0
      GraphStore.store.setFilename filename
      @notifyChange()
    return filename

  onSetIsPublic: (isIt) ->
    @isPublic = isIt
    @notifyChange()

  onSaveFile: ->
    filename = GraphStore.store.filename
    if filename.length > 0
      @action = tr "~FILE.UPLOADING"

      # if this is a save of an existing file with the same name use the fileid
      @fileId = if @lastFilename is filename then @fileId else null
      @lastFilename = filename
      data = GraphStore.store.toJsonString PaletteStore.store.palette

      GoogleDrive.upload {fileName: filename, fileId: @fileId}, data, (err, fileSpec) =>
        if err
          alert err
          @action = null
        else
          @fileId = fileSpec.id
          @action = null
          @docLink = null
          if @isPublic
            GoogleDrive.makePublic fileSpec.id
          @docLink = fileSpec.webContentLink
          GraphStore.store.setSaved()
        @showingSaveDialog = false
        @notifyChange()

  onRevertToOriginal: ->
    if confirm tr "~FILE.CONFIRM_ORIGINAL_REVERT"
      GraphStore.store.revertToOriginal()
      @notifyChange()

  onRevertToLastSave: ->
    if confirm tr "~FILE.CONFIRM_LAST_SAVE_REVERT"
      GraphStore.store.revertToLastSave()
      @notifyChange()

  onLoadAfterAuth: (url) ->
    @pendingLoad = url

  onConnectToApi: ->
    @gapiLoaded = true
    @action     = null
    @notifyChange()
    if @pendingLoad
      authorized = false
      callback = (ignored,json) ->
        GraphStore.store.loadData json

      # non-authorized request
      GoogleDrive.downloadFromUrl @pendingLoad, callback, authorized

GoogleDrive = new GoogleDriveIO()

# wait for gapi to finish initing
waitForAuthCheck = ->
  if gapi?.auth?.authorize
    GoogleDrive.authorize true, ->
      GoogleFileActions.connectToApi()
  else
    setTimeout waitForAuthCheck, 10
waitForAuthCheck()

mixin =
  getInitialState: ->
    gapiLoaded:        false
    fileId:            null
    action:            tr "~FILE.CHECKING_AUTH"
    isPublic:          false
    docLink:          null
    showingSaveDialog: false

  componentDidMount: ->
    GoogleFileStore.listen @onGoogleChange

  onGoogleChange: (newData) ->
    @setState _.clone newData

module.exports =
  actions: GoogleFileActions
  store: GoogleFileStore
  mixin: mixin
