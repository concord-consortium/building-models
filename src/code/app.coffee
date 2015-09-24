AppView     = React.createFactory require './views/app-view'

ValueSlider  =require './views/value-slider-view'
GraphStore   = require './stores/graph-store'
CodapConnect = require './models/codap-connect'
HashParams   = require './utils/hash-parameters'

getParameterByName = (name) ->
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
  regex = new RegExp "[#&]#{name}=([^&]*)"
  results = regex.exec(location.hash)
  if results is null then "" else decodeURIComponent results[1].replace(/\+/g, ' ')

window.initApp = (wireframes=false) ->
  opts =
    # Valid opts are:
    # graphStore: store for the node-link graph
    # publicUrl: Where to load json e.g.'json/serialized.json'
    # googleDoc: try to load a googledoc from the url
    # data: the json to load (compare with publicUrl above)
    graphStore: GraphStore.store
    publicUrl: HashParams.getParam 'publicUrl'
    data: HashParams.getParam 'data'
    googleDoc: HashParams.getParam 'googleDoc'

  opts.codapConnect = CodapConnect.instance 'building-models'
  appView = AppView opts
  elem = '#app'

  jsPlumb.bind 'ready', ->
    React.render appView, $(elem)[0]
