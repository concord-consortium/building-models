AppView = React.createFactory require './views/wireframes/app-view'
LinkManager = require './models/link-manager'

getParameterByName = (name) ->
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
  regex = new RegExp "[\\?&]#{name}=([^&#]*)"
  results = regex.exec(location.search)
  if results is null then "" else decodeURIComponent results[1].replace(/\+/g, ' ')

jsPlumb.bind 'ready', ->
  appView = AppView
    url: 'json/serialized.json'
    linkManager: LinkManager.instance 'building-models'
    data: getParameterByName 'data'
  React.render appView, $('#wireframe-app')[0]

  