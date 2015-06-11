math = require 'mathjs'  # For formula parsing...
tr   = require "../utils/translate"

module.exports = class Relationship

  @defaultText:       tr "~RELATIONSHIP.NO_RELATION"
  @defaultFormula:    "out + 0 * in"
  @defaultGraphThumb: "TBD"
  @errValue:          -1

  @increase:
    id: 0
    prefixIco: "inc"
    text: tr "~NODE-RELATION-EDIT.INCREASES"

  @decrease:
    id: 1
    prefixIco: "dec"
    text: tr "~NODE-RELATION-EDIT.DECREASES"

  @aboutTheSame:
    id: 0
    text: tr "~NODE-RELATION-EDIT.ABOUT_THE_SAME"
    postfixIco: "the-same"

  @aLot:
    id: 1
    text: tr "~NODE-RELATION-EDIT.A_LOT"
    postfixIco: "a-lot"

  @aLittle:
    id: 2
    text: tr "~NODE-RELATION-EDIT.A_LITTLE"
    postfixIco: "a-little"

  @moreAndMore:
    id: 3
    text: tr "~NODE-RELATION-EDIT.MORE_AND_MORE"
    postfixIco: "more-and-more"

  @lessAndLess:
    id: 4
    text: tr "~NODE-RELATION-EDIT.LESS_AND_LESS"
    postfixIco: "less-and-less"

  @inconName: (incdec,amount)->
    "icon-#{incdec.prefixIco}-#{amount.postfixIco}"

  @vectors = [Relationship.increase, Relationship.decrease]
  @scalars = [
    Relationship.aboutTheSame
    Relationship.aLot
    Relationship.aLittle
    Relationship.moreAndMore
    Relationship.lessAndLess
  ]


  @defaultErrHandler: (error,expr,vars)->
    log.error "Error in eval: #{Error}"
    log.error "Expression:    #{expr}"
    log.error "vars=#{vars}"

  constructor: (@opts={}) ->
    @text        = @opts.text       or Relationship.defaultText
    formula      = @opts.formula    or Relationship.defaultFormula
    @graphThumb  = @opts.graphThumb or Relationship.defaultGraphThumb
    @errHandler  = @opts.errHandler or Relationship.defaultErrHandler
    @hasError    = false
    @setFormula(formula)

  setFormula: (newf) ->
    @formula = newf
    @checkFormula()

  checkFormula: ->
    @evaluate(1, 1) #sets the @hasError flag if there is a problem

  evaluate: (inV,outV)->
    result = Relationship.errValue
    scope =
      in: inV
      out: outV
    try
      result = math.eval @formula, scope
    catch error
      @hasError = true
      @errHandler(error, @formula, inV, outV)
    result
