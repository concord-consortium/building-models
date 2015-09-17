Migrations = require '../data/migrations/migrations'

module.exports = class MySystemImporter

  constructor: (@system, @settings) ->
    undefined

  importData: (data) ->
    Migrations.update(data)
    @importNodes data.nodes
    @importLinks data.links
    @settings.importSettings data.settings

  importNodes: (importNodes) ->
    for node in importNodes
      @system.importNode node

  importLinks: (links) ->
    for link in links
      @system.importLink link
