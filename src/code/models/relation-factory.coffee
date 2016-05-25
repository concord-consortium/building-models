tr           = require "../utils/translate"
Relationship = require "./relationship"

module.exports = class RelationFactory
  @increase:
    id: 0
    prefixIco: "inc"
    text: tr "~NODE-RELATION-EDIT.INCREASES"
    formulaFrag: "1 *"
    magnitude: 1
    isCustomRelationship: false
    func: (scalarFunc) ->
      return (scope) ->
        scalarFunc(scope)

  @decrease:
    id: 1
    prefixIco: "dec"
    text: tr "~NODE-RELATION-EDIT.DECREASES"
    formulaFrag: "maxIn -"
    magnitude: -1
    isCustomRelationship: false
    func: (scalarFunc) ->
      return (scope) ->
        scope.maxIn - scalarFunc(scope)

  @vary:
    id: 2
    prefixIco: "var"
    text: tr "~NODE-RELATION-EDIT.VARIES"
    formulaFrag: "0"
    magnitude: 1
    isCustomRelationship: true
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
    formulaFrag: "21.7 * log(max(1,in))"
    magnitude: 2
    gradual: -1
    func: (scope) ->
      return 21.7 * Math.log(Math.max(1,scope.in))

  @custom:
    id: 5
    text: tr "~NODE-RELATION-EDIT.CUSTOM"
    postfixIco: "cus"
    formulaFrag: ""
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
  
  @descriptorIncrease:
    id: 0
    text: tr "~NODE-RELATION-EDIT.AN_INCREASE_IN"
  @descriptorDecrease:
    id: 1
    text: tr "~NODE-RELATION-EDIT.A_DECREASE_IN"
    
  @descriptors: [
    @descriptorIncrease
    @descriptorDecrease
  ]

  @fromSelections: (vector,scalar,existingData) ->
    if vector? and vector.isCustomRelationship
      scalar = @custom
    else if scalar == @custom
      # user switched back from custom relationship to defined
      scalar = @aboutTheSame
    if scalar?
      name = "#{vector.text} #{scalar.text}"
      formula = "#{vector.formulaFrag} #{scalar.formulaFrag}"
      func = vector.func(scalar.func)
      magnitude = vector.magnitude * scalar.magnitude
    new Relationship({text: name, formula: formula, func: func, magnitude: magnitude, customData: existingData})

  @selectionsFromRelation: (relation) ->
    vector = _.find @vectors, (v) ->
      _.startsWith relation.formula, v.formulaFrag
    scalar = _.find @scalars, (s) ->
      _.endsWith relation.formula, s.formulaFrag
    if vector?
      if vector.isCustomRelationship
        scalar = @custom
      else if scalar == @custom
        scalar = undefined
    magnitude = 0
    gradual = 0
    if vector && scalar
      magnitude = vector.magnitude * scalar.magnitude
      gradual = scalar.gradual
    {vector: vector, scalar: scalar, magnitude: magnitude, gradual: gradual}
    
  # @isCustomRelationship: (vector) ->
  #  customRelationship = false
  #  if vector? and vector.id == @vary.id
  #    customRelationship = true
  #  customRelationship
