migration =
  version: "1.18.0"
  description: "Adds link reasoning"
  date: "2016-05-24"

  doUpdate: (data) ->

    for link in data.links
      link.relation.type ?= "range"

module.exports = _.mixin migration, require './migration-mixin'
