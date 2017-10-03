migration =
  version: "1.20.0"
  description: "Removes experiment and frame numbers"
  date: "2017-10-03"

  doUpdate: (data) ->
    delete data.settings.simulation?.experimentNumber
    delete data.settings.simulation?.experimentFrame

module.exports = _.mixin migration, require './migration-mixin'
