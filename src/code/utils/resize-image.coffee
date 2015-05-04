module.exports = (src, callback) ->

  maxWidth = 100
  maxHeight = 100

  img = document.createElement 'img'
  img.setAttribute 'crossOrigin', 'anonymous'
  img.src = src
  img.onload = ->
    canvas = document.createElement 'canvas'
    {width, height} = img
    if width > height
      if width > maxWidth
        height *= maxWidth / width
        width = maxWidth
    else
      if height > maxHeight
        width *= maxHeight / height
        height = maxHeight
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage img, 0, 0, width, height

    callback canvas.toDataURL 'image/png'
