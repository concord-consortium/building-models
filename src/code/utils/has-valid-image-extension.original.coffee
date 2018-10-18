tr = require './translate'

module.exports = (imageName) ->
  link = document.createElement 'a'
  link.setAttribute 'href', imageName
  [..., extension] = link.pathname.split '.'
  valid = (['gif', 'png', 'jpg', 'jpeg'].indexOf extension.toLowerCase()) isnt -1
  if not valid
    alert tr "~DROP.ONLY_IMAGES_ALLOWED"
  valid
