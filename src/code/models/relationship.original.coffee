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
    @type        = @opts.type or "range"
    @text        = @opts.text
    @uiText      = @opts.uiText
    formula      = @opts.formula
    @func        = @opts.func
    @errHandler  = @opts.errHandler or Relationship.defaultErrHandler
    @isDefined   = @opts.formula? or @opts.func?
    @isRange       = @type is "range"
    @isAccumulator = @type is "accumulator"
    @isTransfer    = @type is "transfer"
    @isTransferModifier = @type is "transfer-modifier"
    @hasError    = false
    @setFormula(formula)
    @dataPoints
    @customData  = @opts.customData
    @isCustomRelationship = false

  setFormula: (newf) ->
    @formula = newf
    @checkFormula()

  checkFormula: ->
    if @isDefined
      @evaluate(1, 1) #sets the @hasError flag if there is a problem
      if not @hasError and not @func?
        @func = (math.compile @formula).eval

  evaluate: (inV,outV, maxIn=100, maxOut=100) ->
    result = Relationship.errValue
    scope =
      in: inV
      out: outV
      maxIn: maxIn
      maxOut: maxOut
    if @customData
      roundedInV = Math.round(inV)
      if roundedInV > (maxIn-1)
        roundedInV = (maxIn-1)
      # @customData is in the form [[0,y], [1,y], [2,y], ...]
      if @customData[roundedInV]?
        result = @customData[roundedInV][1]
      else result = 0
    else if @func
      result = @func scope
    else
      try
        result = math.eval @formula, scope
      catch error
        @hasError = true
        @errHandler(error, @formula, inV, outV)
    result

  toExport: ->
    type        : @type
    text        : @text
    formula     : @formula
    customData  : @customData
