AppView     = React.createFactory require './views/app-view'

GraphStore   = require './stores/graph-store'
CodapConnect = require './models/codap-connect'
HashParams   = require './utils/hash-parameters'

getParameterByName = (name) ->
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
  regex = new RegExp "[#&]#{name}=([^&]*)"
  results = regex.exec(location.hash)
  if results is null then "" else decodeURIComponent results[1].replace(/\+/g, ' ')

window.initApp = (wireframes=false) ->
  HashParams.fromLocationHash()
  opts =
    # Valid opts are:
    # graphStore: store for the node-link graph
    # url: Where to load json e.g.'json/serialized.json'
    # data: the json to load (compare with url above)
    graphStore: GraphStore.store
    url: HashParams.getParam 'url'
    data: HashParams.getParam 'data'
    simplified: HashParams.getParam 'simplified'

  debugger
  opts.codapConnect = CodapConnect.instance 'building-models'
  appView = AppView opts
  elem = '#app'

  jsPlumb.bind 'ready', ->
    React.render appView, $(elem)[0]
