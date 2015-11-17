# based on https://github.com/jzaefferer/undo/blob/master/undo.js
CodapConnect = require '../models/codap-connect'

DEFAULT_CONTEXT_NAME = 'building-models'

# Note: We use several actions, because they hook into Reflux's dispatching system
# which puts actions in a stack before calling them. We frequently want to ensure
# that all other actions have completed before, e.g., we end a commandBatch.

class Manager
  constructor: (options = {}) ->
    {@debug} = options
    @commands = []
    @stackPosition = -1
    @savePosition = -1
    @changeListeners = []
    @currentBatch = null

    # listen to all our actions
    @endCommandBatch.listen @_endComandBatch, @
    @undo.listen @_undo, @
    @redo.listen @_redo, @

  startCommandBatch: ->
    @currentBatch = new CommandBatch() unless @currentBatch

  endCommandBatch: Reflux.createAction()

  _endComandBatch: ->
    if @currentBatch
      if @currentBatch.commands.length > 0
        @commands.push @currentBatch
        @stackPosition++
      @currentBatch = null

  createAndExecuteCommand: (name, methods) ->
    result = @execute (new Command name, methods)

    # Only notify CODAP of an undoable action on the first command of a batched command
    if (not @currentBatch) or (@currentBatch.commands.length is 1)
      codapConnect = CodapConnect.instance DEFAULT_CONTEXT_NAME
      codapConnect.sendUndoableActionPerformed()

    result

  execute: (command) ->
    @_clearRedo()
    result = command.execute @debug
    if @currentBatch
      @currentBatch.push command
    else
      @commands.push command
      @stackPosition++
    @_changed()
    @log() if @debug
    result

  undo: Reflux.createAction()

  # @param drop: calling undo(true) will clear the redo stack. When called on
  # the last item, this is equivalent to throwing away the undone action.
  _undo: (drop) ->
    if @canUndo()
      result = @commands[@stackPosition].undo @debug
      @stackPosition--
      if drop then @_clearRedo()
      @_changed()
      @log() if @debug
      result
    else
      false

  canUndo: ->
    return @stackPosition >= 0

  redo: Reflux.createAction()

  _redo: ->
    if @canRedo()
      @stackPosition++
      result = @commands[@stackPosition].redo @debug
      @_changed()
      @log() if @debug
      result
    else
      false

  canRedo: ->
    return @stackPosition < @commands.length - 1

  save: ->
    @savePosition = @stackPosition
    @_changed()

  clearHistory: ->
    @commands = []
    @stackPosition = -1
    @savePosition = -1
    @_changed()
    @log() if @debug

  dirty: ->
    return @stackPosition isnt @savePosition

  saved: ->
    @savePosition isnt -1

  revertToOriginal: ->
    @undo() while @canUndo()

  revertToLastSave: ->
    if @stackPosition > @savePosition
      @undo() while @dirty()
    else if @stackPosition < @savePosition
      @redo() while @dirty()

  addChangeListener: (listener) ->
    @changeListeners.push listener

  log: ->
    log.info "Undo Stack: [#{(_.pluck (@commands.slice 0, @stackPosition + 1), 'name').join ', '}]"
    log.info "Redo Stack: [#{(_.pluck (@commands.slice @stackPosition + 1), 'name').join ', '}]"

  clearRedo: ->
    @_clearRedo()
    @_changed()

  _clearRedo: ->
    @commands = @commands.slice 0, @stackPosition + 1

  _changed: ->
    if @changeListeners.length > 0
      status =
        dirty: @dirty()
        canUndo: @canUndo()
        canRedo: @canRedo()
        saved: @saved()
      for listener in @changeListeners
        listener status

class Command
  constructor: (@name, @methods) -> undefined

  _call: (method, debug, via) ->
    if debug
      log.info("Command: #{@name}.#{method}()#{if via then " via #{via}" else ''}")
    if @methods.hasOwnProperty method
      @methods[method]()
    else
      throw new Error "Undefined #{method} method for #{@name} command"

  execute: (debug) -> @_call 'execute', debug
  undo: (debug) -> @_call 'undo', debug
  redo: (debug) -> @_call 'execute', debug, 'redo'

class CommandBatch
  constructor: ->
    @commands = []

  push: (command) ->
    @commands.push command

  undo: (debug) ->
    command.undo(debug) for command in @commands by -1
  redo: (debug) ->
    command.redo(debug) for command in @commands

instances = {}
instance  = (opts={}) ->
  {contextName, debug} = opts
  contextName ||= DEFAULT_CONTEXT_NAME
  instances[contextName] ||= new Manager(opts)
  instances[contextName]

module.exports =
  instance: instance
  constructor: Manager
  command: Command
