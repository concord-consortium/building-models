migration =
  version: "1.13.0"
  description: "Removes new integration setting"
  date: "2016-01-17"

  doUpdate: (data) ->
    delete data.settings?.simulation?.newIntegration


module.exports = _.mixin migration, require './migration-mixin'
