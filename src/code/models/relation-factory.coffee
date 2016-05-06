tr           = require "../utils/translate"
Relationship = require "./relationship"

module.exports = class RelationFactory
  @increase:
    id: 0
    prefixIco: "inc"
    text: tr "~NODE-RELATION-EDIT.INCREASES"
    formulaFrag: "1 *"
    magnitude: 1
    func: (scalarFunc) ->
      return (scope) ->
        scalarFunc(scope)

  @decrease:
    id: 1
    prefixIco: "dec"
    text: tr "~NODE-RELATION-EDIT.DECREASES"
    formulaFrag: "maxIn -"
    magnitude: -1
    func: (scalarFunc) ->
      return (scope) ->
        scope.maxIn - scalarFunc(scope)

  @vary:
    id: 2
    prefixIco: "var"
    text: tr "~NODE-RELATION-EDIT.VARIES"
    formulaFrag: "0+1 * min(exp(in/21.7)-1, maxOut)"
    magnitude: 1
    func: (scalarFunc) ->
      return (scope) ->
        scalarFunc(scope)

  @aboutTheSame:
    id: 0
    text: tr "~NODE-RELATION-EDIT.ABOUT_THE_SAME"
    postfixIco: "the-same"
    formulaFrag: "in"
    magnitude: 2
    gradual: false
    func: (scope) ->
      return scope.in

  @aLot:
    id: 1
    text: tr "~NODE-RELATION-EDIT.A_LOT"
    postfixIco: "a-lot"
    formulaFrag: "min(in * 2, maxOut)"
    magnitude: 4
    gradual: false
    func: (scope) ->
      return Math.min(scope.in * 2, scope.maxOut)

  @aLittle:
    id: 2
    text: tr "~NODE-RELATION-EDIT.A_LITTLE"
    postfixIco: "a-little"
    formulaFrag: "in / 2"
    magnitude: 1
    gradual: false
    func: (scope) ->
      return scope.in / 2

  @moreAndMore:
    id: 3
    text: tr "~NODE-RELATION-EDIT.MORE_AND_MORE"
    postfixIco: "more-and-more"
    formulaFrag: "min(exp(in/21.7)-1, maxOut)"
    magnitude: 2
    gradual: 1
    func: (scope) ->
      return Math.min(Math.exp(scope.in / 21.7)-1, scope.maxOut)

  @lessAndLess:
    id: 4
    text: tr "~NODE-RELATION-EDIT.LESS_AND_LESS"
    postfixIco: "less-and-less"
    formulaFrag: "21.7 * log(in+1)"
    magnitude: 2
    gradual: -1
    func: (scope) ->
      return 21.7 * Math.log(scope.in+1)

  @custom:
    id: 5
    text: tr "~NODE-RELATION-EDIT.CUSTOM"
    postfixIco: "cus"
    formulaFrag: " * 1"
    magnitude: 2
    gradual: 0
    func: (scope) ->
      return
  
  @unknown:
    id: -1
    text: tr ""
    postfixIco: ""
    formulaFrag: "in"
    magnitude: 0
    gradual: 0
    func: (scope) ->
      return
   
  @iconName: (incdec,amount)->
    "icon-#{incdec.prefixIco}-#{amount.postfixIco}"

  @vectors: [@increase, @decrease, @vary]
  @scalars: [
    @aboutTheSame
    @aLot
    @aLittle
    @moreAndMore
    @lessAndLess
  ]

  @fromSelections: (vector,scalar) ->
    if @customRelation vector
      scalar = @custom
      useCustomData = true
    else if scalar == @custom
      scalar = @aboutTheSame

    if not scalar?
      scalar = @unknown
      
    name = "#{vector.text} #{scalar.text}"
    formula = "#{vector.formulaFrag} #{scalar.formulaFrag}"
    func = vector.func(scalar.func)
    magnitude = vector.magnitude * scalar.magnitude
    new Relationship({text: name, formula: formula, func: func, magnitude: magnitude})

  @selectionsFromRelation: (relation) ->
    vector = _.find @vectors, (v) ->
      _.startsWith relation.formula, v.formulaFrag
    scalar = _.find @scalars, (s) ->
      _.endsWith relation.formula, s.formulaFrag
    useCustomData = false
    if vector?
      if @customRelation vector
        scalar = @custom
        useCustomData = true
      else if scalar == @custom
        scalar = @aboutTheSame
    magnitude = 0
    gradual = 0
    if vector && scalar
      magnitude = vector.magnitude * scalar.magnitude
      gradual = scalar.gradual
    {vector: vector, scalar: scalar, magnitude: magnitude, gradual: gradual, useCustomData: useCustomData}
    
  @customRelation: (vector) ->
    isCustomRelation = false
    if vector? and vector.id == @vary.id
      isCustomRelation = true
    isCustomRelation
