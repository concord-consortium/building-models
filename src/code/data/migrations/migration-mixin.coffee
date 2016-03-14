# Implement version: xx and doUpdate: (data) ->  in your migrations.
# and mixin this module

semver = require "semver"

module.exports =
  needsUpdate: (data) ->
    version = data.version || "0.0.0"

    if typeof version is "number" then version = @_semverize(version)

    semver.gt(@version, version)

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

  # Change x.y to "x.y.0". The only annoyance is we have to special-case 1.95,
  # as this was supposed to be < 1.10.0
  _semverize: (v) ->
    if (v is 1.95)
      return "1.9.5"
    else
      return v + ".0"

