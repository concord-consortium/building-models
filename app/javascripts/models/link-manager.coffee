_   = require('lodash')
log = require('loglevel')


# LinkManager is the logical manager of Nodes and Links.
class LinkManager
  constructor: () ->
    @linkKeys = {}

  hasLink: (link) ->
    @linkKeys[link.terminalKey()]?

  addLink: (link) ->
    unless @hasLink(link)
      @linkKeys[link.terminalKey()] = link
      return true
    return false


module.exports = LinkManager
