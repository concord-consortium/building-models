resizeImage = require './resize-image'

module.exports = (e, callback) ->
  if e.dataTransfer.files.length > 0
    for file in e.dataTransfer.files
      if /^image\//.test file.type
        reader = new FileReader()
        reader.addEventListener 'loadend', (e) ->
          resizeImage e.target.result, (dataUrl) ->
            callback
              name: file.name
              title: (file.name.split '.')[0]
              image: dataUrl
              metadata:
                source: 'external'
                link: file.name
        reader.readAsDataURL file
  else
    url = e.dataTransfer.getData 'URL'
    callback
      name: ''
      title: ''
      image: url
      metadata:
        source: 'external'
        link: url

