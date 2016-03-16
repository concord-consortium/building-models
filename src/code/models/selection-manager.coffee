Importer    = require '../utils/importer'
Link        = require './link'
DiagramNode = require './node'
tr          = require "../utils/translate"


module.exports = class SelectionManager
  @NodeTitleEditing   = "NodeTitleEditing"
  @NodeInspection     = "NodeInspection"
  @LinkInspection     = "LinkInspection"

  constructor: ->
    @selections = []
    @selectionListeners = []

  addSelectionListener: (listener) ->
    log.info("adding selection listener #{listener}")
    @selectionListeners.push listener


  _notifySelectionChange: ->
    log.info "notifiying listeners"
    for listener in @selectionListeners
      listener @

  addToSelection: (graphprimitive, context) ->
    entry = {graphprimitive: graphprimitive, context: context, key: graphprimitive.key}
    unless @isSelected(graphprimitive,context)
      @selections.push entry
      @_notifySelectionChange()


  selectOnly: (graphprimitive, context) ->
    unless @isSelected(graphprimitive, context)
      @clearSelection(context)
      @addToSelection(graphprimitive,context)

  selection: (context) ->
    where = {}
    where.context = context if context
    _.chain @selections
    .where where
    .map (obj,i) ->
      obj.graphprimitive
    .value()

  clearSelection: (context=null) ->
    @_deselect({context:context})

  clearLinkInspection: ->
    @clearSelection(SelectionManager.LinkInspection)

  clearSelectionFor:(graphprimitive, context=null) ->
    @_deselect({key:graphprimitive.key, context:context})

  isSelected: (graphprimitive, context) ->
    where = {key: graphprimitive.key}
    where.context = context if context
    found = _.chain @selections
    .where where
    .value()
    found.length > 0

  selectNodeForTitleEditing: (graphprimitive) ->
    @_selectForTitleEditing(graphprimitive, SelectionManager.NodeTitleEditing)
    @clearSelection(SelectionManager.LinkTitleEditing)

  _selectForTitleEditing: (graphprimitive, context) ->
    @selectOnly(graphprimitive, context)
    # unselect the inspection selection, unless its this same graphprimitive.
    unless @isSelectedForInspection(graphprimitive)
      @clearInspection()

  clearInspection: ->
    @clearNodeInspection()
    @clearLinkInspection()

  clearTitleEditing: ->
    @clearSelection(SelectionManager.NodeTitleEditing)
    @clearSelection(SelectionManager.LinkTitleEditing)

  isSelectedForTitleEditing: (graphprimitive)->
    @isSelected(graphprimitive,SelectionManager.NodeTitleEditing) or
      @isSelected(graphprimitive,SelectionManager.LinkTitleEditing)

  getNodeTitleEditing: ->
    @selection(SelectionManager.NodeTitleEditing)

  selectNodeForInspection: (graphprimitive) ->
    @selectOnly(graphprimitive, SelectionManager.NodeInspection)
    @clearLinkInspection()

    # unselect the title selection, unless its this same graphprimitive.
    unless @isSelectedForTitleEditing(graphprimitive)
      @clearTitleEditing()

  clearNodeInspection: ->
    @clearSelection(SelectionManager.NodeInspection)

  isSelectedForInspection: (graphprimitive) ->
    @isSelected(graphprimitive,SelectionManager.NodeInspection) or
      @isSelected(graphprimitive,SelectionManager.LinkInspection)

  getNodeInspection: ->
    @selection(SelectionManager.NodeInspection)

  getLinkInspection: ->
    @selection(SelectionManager.LinkInspection)

  selectLinkForInspection: (graphprimitive)->
    @selectOnly(graphprimitive, SelectionManager.LinkInspection)
    @clearNodeInspection()

    # unselect the title selection, unless its this same graphprimitive.
    unless @isSelectedForTitleEditing(graphprimitive)
      @clearTitleEditing()

  _deselect: (opts)->
    pickNonEmpty    = _.partial _.pick, _, _.identity
    removeCritereon = pickNonEmpty opts
    log.info removeCritereon
    if removeCritereon.context or removeCritereon.key
      log.info "removing #{removeCritereon.key}"
      log.info "in collection #{_.pluck @selections, 'key'}"
      _.remove @selections, removeCritereon
      log.info "in collection #{_.pluck @selections, 'key'}"
    else
      @selections = []
    @_notifySelectionChange()
