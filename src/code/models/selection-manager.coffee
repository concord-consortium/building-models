Importer    = require '../utils/importer'
Link        = require './link'
DiagramNode = require './node'
UndoRedo    = require '../utils/undo-redo'
tr          = require "../utils/translate"


module.exports = class SelectionManager
  @NodeTitleEditing   = "NodeTitleEditing"
  @NodeInpsection     = "NodeInpsection"
  @LinkSelection      = "LinkSelection"

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

  clearLinkSelection: ->
    @clearSelection(SelectionManager.LinkSelection)

  clearSelectionFor:(graphprimitive, context=null) ->
    @_deselect({key:graphprimitive.key, context:context})

  isSelected: (graphprimitive, context) ->
    where = {key: graphprimitive.key}
    where.context = context if context
    found = _.chain @selections
    .where where
    .value()
    found.length > 0

  selectForTitleEditing: (graphprimitive) ->
    @selectOnly(graphprimitive,SelectionManager.NodeTitleEditing)
    # unselect the inspection selection, unless its this same graphprimitive.
    unless @isSelectedForInspection(graphprimitive)
      @clearInspection()

  clearTitleEditing: ->
    @clearSelection(SelectionManager.NodeTitleEditing)

  isSelectedForTitleEditing: (graphprimitive)->
    @isSelected(graphprimitive,SelectionManager.NodeTitleEditing)

  getTitleEditing: ->
    @selection(SelectionManager.NodeTitleEditing)

  selectForInspection: (graphprimitive) ->
    @selectOnly(graphprimitive, SelectionManager.NodeInpsection)
    @clearLinkSelection()

    # unselect the title selection, unless its this same graphprimitive.
    unless @isSelectedForTitleEditing(graphprimitive)
      @clearTitleEditing()


  clearInspection: ->
    @clearSelection(SelectionManager.NodeInpsection)

  isSelectedForInspection: (graphprimitive) ->
    @isSelected(graphprimitive,SelectionManager.NodeInpsection)

  getInspection: ->
    @selection(SelectionManager.NodeInpsection)

  getLinkSelection: ->
    @selection(SelectionManager.LinkSelection)

  selectLink: (graphprimitive)->
    @clearInspection()
    @selectOnly(graphprimitive, SelectionManager.LinkSelection)

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
