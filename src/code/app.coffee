AppView     = React.createFactory require './views/app-view'

ValueSlider  =require './views/value-slider-view'
GraphStore   = require './stores/graph-store'
PaletteStore = require './stores/palette-store'
HashParams   = require './utils/hash-parameters'

getParameterByName = (name) ->
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
  regex = new RegExp "[#&]#{name}=([^&]*)"
  results = regex.exec(location.hash)
  if results is null then "" else decodeURIComponent results[1].replace(/\+/g, ' ')

appView = null

# App API
window.Ivy =
  initApp: (wireframes=false) ->
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

    appView = AppView opts
    elem = '#app'

    jsPlumb.bind 'ready', ->
      React.render appView, $(elem)[0]

  clearModel: ->
    appView?.props.graphStore.deleteAll()

  serializeModel: ->
    return appView?.props.graphStore.toJsonString PaletteStore.store.palette

  loadModel: (data) ->
    appView?.props.graphStore.deleteAll()
    if typeof data is "string"
      data = JSON.parse data
    appView?.props.graphStore.loadData data

  addChangeListener: (listener) ->
    appView?.props.graphStore.addChangeListener listener
