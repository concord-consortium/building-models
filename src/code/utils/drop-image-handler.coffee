module.exports = class DropImageHandler

  constructor: (options) ->
    {@maxWidth, @maxHeight} = options
    
  _resizeImage: (filename, src, callback) ->
    img = document.createElement 'img'
    img.src = src
    img.setAttribute 'crossOrigin', 'anonymous'
    img.onload = =>
      canvas = document.createElement 'canvas'
      {width, height} = img
      if width > height
        if width > @maxWidth
          height *= @maxWidth / width
          width = @maxWidth
      else
        if height > @maxHeight
          width *= @maxHeight / height
          height = @maxHeight
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage img, 0, 0, width, height
      callback
        name: filename
        title: (filename.split '.')[0]
        image: canvas.toDataURL 'image/png'
    
  handleDrop: (e, callback) ->
    if e.dataTransfer.files.length > 0
      for file in e.dataTransfer.files
        if /^image\//.test file.type
          reader = new FileReader()
          reader.addEventListener 'loadend', (e) =>
            @_resizeImage file.name, e.target.result, callback
          reader.readAsDataURL file
    else
      url = e.dataTransfer.getData 'URL'
      if url
        alert 'Sorry dragging images from other web pages is not supported yet.\n\nYou can drag images saved locally on your computer.'
        # TODO: create image server to avoid CORS problems?
        # @_resizeImage '', url, callback
