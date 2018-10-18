migration =
  version: "1.16.0"
  description: "Removes simulation setting for speed"
  date: "2016-11-17"

  doUpdate: (data) ->
    delete data.settings?.simulation?.speed

module.exports = _.mixin migration, require './migration-mixin'
