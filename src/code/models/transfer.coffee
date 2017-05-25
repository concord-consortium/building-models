Node = require './node'
tr = require "../utils/translate"

module.exports = class Transfer extends Node

  type: 'Transfer'
  isTransfer: true

  setTransferLink: (link) ->
    @transferLink = link
    @title = @computeTitle()

  computeTitle: ->
    if @transferLink
      tr '~TRANSFER_NODE.TITLE', { sourceTitle: @transferLink.sourceNode.title, \
                                    targetTitle: @transferLink.targetNode.title }
    else
      undefined