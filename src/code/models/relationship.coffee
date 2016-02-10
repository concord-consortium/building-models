math = require 'mathjs'  # For formula parsing...
tr   = require "../utils/translate"

module.exports = class Relationship

  @defaultText:       tr "~NODE-RELATION-EDIT.INCREASES"
  @defaultFormula:    "1 * in"
  @defaultGraphThumb: "TBD"
  @errValue:          -1
  @defaultFunc: (scope) ->
    scope.in


  @defaultErrHandler: (error,expr,vars)->
    log.error "Error in eval: #{Error}"
    log.error "Expression:    #{expr}"
    log.error "vars=#{vars}"

  constructor: (@opts={}) ->
    @text        = @opts.text       or Relationship.defaultText
    formula      = @opts.formula    or Relationship.defaultFormula
    @graphThumb  = @opts.graphThumb or Relationship.defaultGraphThumb
    @errHandler  = @opts.errHandler or Relationship.defaultErrHandler
    @func        = @opts.func       or if formula is Relationship.defaultFormula then Relationship.defaultFunc else null
    @hasError    = false
    @setFormula(formula)

  setFormula: (newf) ->
    @formula = newf
    @checkFormula()

  checkFormula: ->
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
