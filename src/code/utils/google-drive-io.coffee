module.exports = class GoogleDriveIO

  APP_ID : '1095918012594'
  DEVELOPER_KEY: 'AIzaSyAUobrEXqtbZHBvr24tamdE6JxmPYTRPEA'
  CLIENT_ID: '1095918012594-svs72eqfalasuc4t1p1ps1m8r9b8psso.apps.googleusercontent.com'
  SCOPES: 'https://www.googleapis.com/auth/drive'

  authorized: false

  token: null

  authorize: (immediate, callback) ->
    if @token
      callback null, @token
    else
      args =
        'client_id': @CLIENT_ID
        'scope': @SCOPES
        'immediate': immediate or false
      gapi.auth.authorize args, (token) =>
        if token and not token.error
          @token = token
        if callback
          err = (if not token
            'Unable to authorize'
          else if token.error
            token.error
          else
            null
          )
          @authorized = err is null
          callback err, token

  makeMultipartBody: (parts, boundary) ->
    ((for part in parts
      "\r\n--#{boundary}\r\nContent-Type: application/json\r\n\r\n#{part}"
    ).join '') + "\r\n--#{boundary}--"

  sendFile: (fileSpec, contents, callback) ->
    boundary = '-------314159265358979323846'
    metadata = JSON.stringify
      title: fileSpec.fileName
      mimeType: 'application/json'

    [method, path] = if fileSpec.fileId
      ['PUT', "/upload/drive/v2/files/#{fileSpec.fileId}"]
    else
      ['POST', '/upload/drive/v2/files']

    request = gapi.client.request
      path: path
      method: method
      params: {uploadType: 'multipart', alt: 'json'}
      headers: {'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'}
      body: @makeMultipartBody [metadata, contents], boundary

    request.execute (file) ->
      if callback
        if file
          callback null, file
        else
          callback 'Unabled to upload file'

  upload: (fileSpec, contents, callback) ->
    @authorize @authorized, (err) =>
      if not err
        gapi.client.load 'drive', 'v2', => @sendFile fileSpec, contents, callback
      else
        callback "No authorization. Upload failed for file: #{fileSpec.fileName}"

  makePublic: (fileId) ->
    perms =
      'value': ''
      'type': 'anyone'
      'role': 'reader'

    request = gapi.client.drive.permissions.insert
      'fileId': fileId
      'resource': perms

    request.execute (resp) ->
      if resp.code and resp.code isnt 200
        alert "there was a problem sharing your document."

  download: (fileSpec, callback) ->
    @authorize @authorized, (err, token) =>
      if err
        callback err
      else
        gapi.client.load 'drive', 'v2', =>
          request = gapi.client.drive.files.get
            fileId: fileSpec.id
          request.execute (file) =>
            if file?.downloadUrl
              @_downloadFromUrl file.downloadUrl
            else
              callback "Unable to get download url"

  downloadFromUrl: (url, callack) ->
    @authorize @authorized, (err, token) =>
      @_downloadFromUrl url, token, callack

  _downloadFromUrl: (url, token, callback) ->
    xhr = new XMLHttpRequest()
    xhr.open 'GET', url
    xhr.setRequestHeader 'Authorization', "Bearer #{token.access_token}"
    xhr.onload = ->
      try
        json = JSON.parse xhr.responseText
      catch e
        callback e
        return
      callback null, json
    xhr.onerror = ->
      callback "Unable to download #{file.downloadUrl}"
    xhr.send()

  filePicker: (callback) ->
    @authorize @authorized, (err, token) ->
      if err
        callback err
      else
        gapi.load 'picker', callback: ->
          pickerCallback = (data, etc) ->
            callback null, if data.action is 'picked' then data.docs[0] else null
          picker = new google.picker.PickerBuilder()
            .addView google.picker.ViewId.DOCS
            .setOAuthToken token.access_token
            .setCallback pickerCallback
            .build()
          picker.setVisible true
