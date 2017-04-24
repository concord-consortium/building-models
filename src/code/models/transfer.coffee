Node = require './node'

module.exports = class Transfer extends Node

  type: 'Transfer'
  isTransfer: true

  setTransferLink: (link) ->
    @transferLink = link
    @title = @computeTitle()

  computeTitle: ->
    if @transferLink
      "flows from #{@transferLink.sourceNode.title} to #{@transferLink.targetNode.title}"
    else
      undefined