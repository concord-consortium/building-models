resizeImage = require './resize-image'
hasValidImageExtension = require '../utils/has-valid-image-extension'

module.exports = (e, callback) ->
  if e.dataTransfer.files.length > 0
    for file in e.dataTransfer.files
      if hasValidImageExtension file.name
        reader = new FileReader()
        reader.addEventListener 'loadend', (e) ->
          resizeImage e.target.result, (dataUrl) ->
            callback
              name: file.name
              title: (file.name.split '.')[0]
              image: dataUrl
              metadata:
                source: 'external'
                title: (file.name.split '.')[0]
        reader.readAsDataURL file
  else
    url = e.dataTransfer.GraphStore 'URL'
    if hasValidImageExtension url
      callback
        name: ''
        title: ''
        image: url
        metadata:
          source: 'external'
          link: url

