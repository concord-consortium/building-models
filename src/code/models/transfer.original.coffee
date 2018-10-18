Node = require './node'
tr = require "../utils/translate"

DEFAULT_COMBINE_METHOD='product'

module.exports = class Transfer extends Node

  type: 'Transfer'
  isTransfer: true
  combineMethod: DEFAULT_COMBINE_METHOD

  setTransferLink: (link) ->
    @transferLink = link
    @title = @computeTitle()

  computeTitle: ->
    if @transferLink
      tr '~TRANSFER_NODE.TITLE', { sourceTitle: @transferLink.sourceNode.title, \
                                    targetTitle: @transferLink.targetNode.title }
    else
      undefined