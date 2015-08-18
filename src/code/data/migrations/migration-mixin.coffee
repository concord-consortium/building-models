# Implement version: xx and doUpdate: (data) ->  in your migrations.
# and mixin this module

module.exports =
  # TODO: possibly use semver https://github.com/npm/node-semver
  needsUpdate: (data) ->
    (data.version or 0) < @version

  name: ->
    "#{@version} – #{@date} : #{@description}"

  update: (data) ->
    if @needsUpdate(data)
      @doUpdate(data)
      log.info "✔ upgradded #{@name()}"
      data.version = @version
    else
      log.info "  skipped : #{@name()}"
    data
