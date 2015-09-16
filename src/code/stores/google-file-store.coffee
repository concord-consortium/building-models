GoogleDriveIO = require '../utils/google-drive-io'
GraphStore    = require './graph-store'
PaletteStore  = require './palette-store'
HashParams    = require "../utils/hash-parameters"

tr = require '../utils/translate'

GoogleFileActions = Reflux.createActions [
  "showSaveDialog", "newFile", "openFile",
  "rename", "setIsPublic", "saveFile", "close"
  "revertToOriginal", "revertToLastSave", "connectToApi"
  "addAfterAuthHandler"
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
      filename: @filename
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
      HashParams.clearParam('googleDoc')
      HashParams.clearParam('publicUrl')
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
        @loadFile(fileSpec)

  onRename: (filename) ->
    if filename.length > 0
      GraphStore.store.setFilename filename
      HashParams.clearParam('publicUrl')
      HashParams.clearParam('googleDoc')
      @notifyChange()
    return filename

  onSetIsPublic: (isPublic) ->
    @isPublic = isPublic
    if not isPublic
      HashParams.clearParam('publicUrl')
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
            # have to specify CORS proxy to make this work for anonymous
            @docLink = "http://cors.io/?u=#{fileSpec.webContentLink}"
            HashParams.setParam("publicUrl", @docLink)
          else
            HashParams.setParam("googleDoc", @fileId)
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

  onAddAfterAuthHandler: (callback) ->
    @afterLoadCallbacks ||= []
    @afterLoadCallbacks.push callback

  onConnectToApi: ->
    @afterLoadCallbacks ||= []
    @gapiLoaded = true
    @action     = null
    @notifyChange()
    _.each @afterLoadCallbacks, (callback) =>
      callback(@)
    @afterLoadCallbacks = null

  # non-authorized request
  loadPublicUrl: (url) ->
    authorized = false
    callback = (ignored,json) ->
      GraphStore.store.loadData json

    GoogleDrive.downloadFromUrl url, callback, authorized

  loadFile: (fileSpec) ->
    context = @
    GoogleDrive.download fileSpec, (err, data) =>
      if err
        alert err
        @action = null
      else
        @fileId = fileSpec.id
        @action = null
        @lastFilename = data.filename
        GraphStore.store.deleteAll()
        GraphStore.store.loadData data
        GraphStore.store.setFilename data.filename
        HashParams.setParam('googleDoc', @fileId)
      @notifyChange()

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
    filename:          @filename
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
