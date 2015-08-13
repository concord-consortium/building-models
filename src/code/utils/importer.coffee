Migrations = require '../data/migrations/migrations'

module.exports = class MySystemImporter

  constructor: (@system) ->
    undefined

  importData: (data) ->
    Migrations.update(data)
    @importNodes data.nodes
    @importLinks data.links

  importNodes: (importNodes) ->
    for node in importNodes
      @system.importNode node

  importLinks: (links) ->
    for link in links
      @system.importLink link
