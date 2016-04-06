math = require 'mathjs'  # For formula parsing...
tr   = require "../utils/translate"

module.exports = class Relationship

  @errValue:          -1
  @defaultFunc: (scope) ->
    scope.in


  @defaultErrHandler: (error,expr,vars)->
    log.error "Error in eval: #{Error}"
    log.error "Expression:    #{expr}"
    log.error "vars=#{vars}"

  constructor: (@opts={}) ->
    @text        = @opts.text
    formula      = @opts.formula
    @func        = @opts.func
    @errHandler  = @opts.errHandler or Relationship.defaultErrHandler
    @isDefined   = @opts.formula? or @opts.func?
    @hasError    = false
    @setFormula(formula)
    @magnitude   = @opts.magnitude or 0

  setFormula: (newf) ->
    @formula = newf
    @checkFormula()

  checkFormula: ->
    @isDefined   = @opts.formula? or @opts.func?
    if @isDefined
      @evaluate(1, 1) #sets the @hasError flag if there is a problem

  evaluate: (inV,outV, maxIn=100, maxOut=100)->
    result = Relationship.errValue
    scope =
      in: inV
      out: outV
      maxIn: maxIn
      maxOut: maxOut
    if @func
      result = @func scope
    else
      try
        result = math.eval @formula, scope
      catch error
        @hasError = true
        @errHandler(error, @formula, inV, outV)
    result

  toExport: ->
    text        : @text
    formula     : @formula
