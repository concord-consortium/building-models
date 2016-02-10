tr           = require "../utils/translate"
Relationship = require "./relationship"

ln12 = Math.log(1.2)

module.exports = class RelationFactory
  @increase:
    id: 0
    prefixIco: "inc"
    text: tr "~NODE-RELATION-EDIT.INCREASES"
    formulaFrag: "1 *"
    func: (scalarFunc) ->
      return (scope) ->
        scalarFunc(scope)

  @decrease:
    id: 1
    prefixIco: "dec"
    text: tr "~NODE-RELATION-EDIT.DECREASES"
    formulaFrag: "maxIn -"
    func: (scalarFunc) ->
      return (scope) ->
        scope.maxIn - scalarFunc(scope)

  @aboutTheSame:
    id: 0
    text: tr "~NODE-RELATION-EDIT.ABOUT_THE_SAME"
    postfixIco: "the-same"
    formulaFrag: "in"
    func: (scope) ->
      return scope.in

  @aLot:
    id: 1
    text: tr "~NODE-RELATION-EDIT.A_LOT"
    postfixIco: "a-lot"
    formulaFrag: "min(in * 2, maxOut)"
    func: (scope) ->
      return Math.min(scope.in * 2, scope.maxOut)

  @aLittle:
    id: 2
    text: tr "~NODE-RELATION-EDIT.A_LITTLE"
    postfixIco: "a-little"
    formulaFrag: "in / 2"
    func: (scope) ->
      return scope.in / 2

  @moreAndMore:
    id: 3
    text: tr "~NODE-RELATION-EDIT.MORE_AND_MORE"
    postfixIco: "more-and-more"
    formulaFrag: "min((in ^ 2)/10, maxOut)"
    func: (scope) ->
      return Math.min((scope.in * scope.in)/10, scope.maxOut)

  @lessAndLess:
    id: 4
    text: tr "~NODE-RELATION-EDIT.LESS_AND_LESS"
    postfixIco: "less-and-less"
    formulaFrag: "log(in) / 0.1823215"
    func: (scope) ->
      return Math.log(scope.in) / ln12

  @iconName: (incdec,amount)->
    "icon-#{incdec.prefixIco}-#{amount.postfixIco}"

  @vectors: [@increase, @decrease]
  @scalars: [
    @aboutTheSame
    @aLot
    @aLittle
    @moreAndMore
    @lessAndLess
  ]

  @fromSelections: (vector,scalar) ->
    name = "#{vector.text} #{scalar.text}"
    formula = "#{vector.formulaFrag} #{scalar.formulaFrag}"
    func = vector.func(scalar.func)
    new Relationship({text: name, formula: formula, func: func})

  @selectionsFromRelation: (relation) ->
    vector = _.find @vectors, (v) ->
      _.startsWith relation.formula, v.formulaFrag
    scalar = _.find @scalars, (s) ->
      _.endsWith relation.formula, s.formulaFrag
    {vector: vector, scalar: scalar}
