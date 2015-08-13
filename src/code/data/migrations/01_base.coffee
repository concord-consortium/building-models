# FORMAT BEFORE THIS TRANSFORM: in serialized-test-data-0.1.coffee
# FORMAT AFTER THIS TRANSFORM:  in serialized-test-data-1.0.coffee

migration =
  version: 1.0
  description: "The initial migrations from old mysystem style file format."
  date: "2015-08-12"

  doUpdate: (data) ->
    @updateNodes(data)
    @updateLinks(data)
    @updatePalette(data)
    data

  updateNodes: (data) ->
    data.nodes = _.map (data.nodes or []), (node) ->
      key: node.key
      data: node

  updateLinks: (data) ->
    data.links = _.map (data.links or []), (link) ->
      sourceNode: link.sourceNodeKey
      targetNode: link.targetNodeKey
      sourceTerminal: link.sourceTerminal
      targetTerminal: link.targetTerminal
      title: link.title
      color: link.color

  updatePalette: (data) ->
    # don't do anything if a palette is already defined
    unless data.palette
      data.palette = _.map data.nodes, (node) ->
        image: node.data.image
        key: node.data.image  # TODO truncate this?
        title: node.data.title
        metadata:
          title: node.data.title
          source: "external"
          link: null
          license: "public domain"
      data.palette.push
        title: "",
        image: "img/nodes/blank.png"
        key: "img/nodes/blank.png"
        metadata:
          source: "internal",
          title: "Blank",
          link: null,
          license: "public domain"

module.exports = _.mixin migration, require './migration-mixin'
