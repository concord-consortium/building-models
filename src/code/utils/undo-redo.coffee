# based on https://github.com/jzaefferer/undo/blob/master/undo.js

class Manager
  constructor: (options = {}) ->
    {@debug} = options
    @commands = []
    @stackPosition = -1
    @savePosition = -1
    @changeListeners = []

  createAndExecuteCommand: (name, methods) ->
    @execute (new Command name, methods)

  execute: (command) ->
    @_clearRedo()
    result = command.execute @debug
    @commands.push command
    @stackPosition++
    @_changed()
    @log() if @debug
    result

  undo: ->
    if @canUndo()
      result = @commands[@stackPosition].undo @debug
      @stackPosition--
      @_changed()
      @log() if @debug
      result
    else
      false

  canUndo: ->
    return @stackPosition >= 0

  redo: ->
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

  addChangeListener: (listener) ->
    @changeListeners.push listener

  log: ->
    log.info "Undo Stack: [#{(_.pluck (@commands.slice 0, @stackPosition + 1), 'name').join ', '}]"
    log.info "Redo Stack: [#{(_.pluck (@commands.slice @stackPosition + 1), 'name').join ', '}]"

  _clearRedo: ->
    @commands = @commands.slice 0, @stackPosition + 1

  _changed: ->
    if @changeListeners.length > 0
      status =
        dirty: @dirty()
        canUndo: @canUndo()
        canRedo: @canRedo()
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

module.exports =
  Manager: Manager
  Command: Command

