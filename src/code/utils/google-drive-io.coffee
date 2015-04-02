module.exports = class GoogleDriveIO

  CLIENT_ID: '1095918012594-svs72eqfalasuc4t1p1ps1m8r9b8psso.apps.googleusercontent.com'
  SCOPES: 'https://www.googleapis.com/auth/drive'

  authorize: (immediate, callback) ->
    args =
      'client_id': @CLIENT_ID
      'scope': @SCOPES
      'immediate': immediate or false
    gapi.auth.authorize args, callback

  makeMultipartBody: (parts, boundary) ->
    ((for part in parts
      type = "\r\n--#{boundary}\r\nContent-Type: #{part.fileType}"
      encoding = if part.encoding then "\r\nContent-Transfer-Encoding: #{part.encoding}" else ''
      "#{type}#{encoding}\r\n\r\n#{part.message}"
    ).join '') + "\r\n--#{boundary}--"
    
  sendFile: (fileSpec, contents, callback) ->
    boundary = '-------314159265358979323846'
    contentType = fileSpec.mimeType || 'application/octet-stream'
    metadata =
      'title': fileSpec.fileName
      'mimeType': contentType
    parts = [
      {
        fileType: contentType
        message: JSON.stringify metadata
      }, 
      {
        fileType: 'application/json'
        message: contents
      }
    ]
    multipartRequestBody = @makeMultipartBody parts, boundary
    
    request = gapi.client.request
      path: '/upload/drive/v2/files'
      method: 'POST'
      params: 
        uploadType: 'multipart'
      headers:
       'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
      body: multipartRequestBody

    request.execute callback or ((file) -> console.log file)
  
  upload: (fileSpec, contents) ->
    @authorize true, (token) =>
      if token and not token.error
        gapi.client.load 'drive', 'v2', => @sendFile fileSpec, contents
      else
        console.log "No authorization. Upload failed for file: #{fileSpec.fileName}"

