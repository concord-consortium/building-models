AppView     = React.createFactory require './views/app-view'
LinkManager = require './models/link-manager'
CodapConnect = require './models/codap-connect'

getParameterByName = (name) ->
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
  regex = new RegExp "[#&]#{name}=([^&]*)"
  results = regex.exec(location.hash)
  if results is null then "" else decodeURIComponent results[1].replace(/\+/g, ' ')

window.initApp = (wireframes=false) ->
  opts =
    # Valid opts are:
    # url: Where to load json e.g.'json/serialized.json'
    # linkManager: The instance of the link-manager we are talking with
    # data: the json to load (compare with url above)
    linkManager: LinkManager.instance 'building-models'
    data: getParameterByName 'data'

  opts.codapConnect = CodapConnect.instance 'building-models'

  appView = AppView opts
  elem = '#app'

  jsPlumb.bind 'ready', ->
    React.render appView, $(elem)[0]
