migration =
  version: "1.17.0"
  description: "Adds experiment number to serialization"
  date: "2017-01-09"

  doUpdate: (data) ->
    data.settings.simulation?.experimentNumber ||= 0
    data.settings.simulation?.experimentFrame ||= 0

module.exports = _.mixin migration, require './migration-mixin'
