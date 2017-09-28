tr           = require "../utils/translate"
Relationship = require "./relationship"

module.exports = class RelationFactory
  @increase:
    type: "range"
    id: "increase"
    prefixIco: "inc"
    text: "increase"
    uiText: tr "~NODE-RELATION-EDIT.INCREASES"
    formulaFrag: "1 *"
    magnitude: 1
    isCustomRelationship: false
    func: (scalarFunc) ->
      return (scope) ->
        scalarFunc(scope)

  @decrease:
    type: "range"
    id: "decrease"
    prefixIco: "dec"
    text: "decrease"
    uiText: tr "~NODE-RELATION-EDIT.DECREASES"
    formulaFrag: "maxIn -"
    magnitude: -1
    isCustomRelationship: false
    func: (scalarFunc) ->
      return (scope) ->
        scope.maxIn - scalarFunc(scope)

  @vary:
    type: "range"
    id: "vary"
    prefixIco: "var"
    text: "vary"
    uiText: tr "~NODE-RELATION-EDIT.VARIES"
    formulaFrag: "0"
    magnitude: 1
    isCustomRelationship: true
    func: (scalarFunc) ->
      return (scope) ->
        scalarFunc(scope)

  @aboutTheSame:
    type: "range"
    id: "aboutTheSame"
    text: "about the same"
    uiText: tr "~NODE-RELATION-EDIT.ABOUT_THE_SAME"
    postfixIco: "the-same"
    formulaFrag: "in"
    magnitude: 2
    gradual: false
    func: (scope) ->
      return scope.in

  @aLot:
    type: "range"
    id: "aLot"
    text: "a lot"
    uiText: tr "~NODE-RELATION-EDIT.A_LOT"
    postfixIco: "a-lot"
    formulaFrag: "min(in * 2, maxOut)"
    magnitude: 4
    gradual: false
    func: (scope) ->
      return Math.min(scope.in * 2, scope.maxOut)

  @aLittle:
    type: "range"
    id: "aLittle"
    text: "a little"
    uiText: tr "~NODE-RELATION-EDIT.A_LITTLE"
    postfixIco: "a-little"
    formulaFrag: "(in+(maxOut/2)) / 2"
    magnitude: 1
    gradual: false
    func: (scope) ->
      return (scope.in + (scope.maxOut/2)) / 2

  @moreAndMore:
    type: "range"
    id: "moreAndMore"
    text: "more and more"
    uiText: tr "~NODE-RELATION-EDIT.MORE_AND_MORE"
    postfixIco: "more-and-more"
    formulaFrag: "min(exp(in/21.7)-1, maxOut)"
    magnitude: 2
    gradual: 1
    func: (scope) ->
      return Math.min(Math.exp(scope.in / 21.7)-1, scope.maxOut)

  @lessAndLess:
    type: "range"
    id: "lessAndLess"
    text: "less and less"
    uiText: tr "~NODE-RELATION-EDIT.LESS_AND_LESS"
    postfixIco: "less-and-less"
    formulaFrag: "21.7 * log(max(1,in))"
    magnitude: 2
    gradual: -1
    func: (scope) ->
      return 21.7 * Math.log(Math.max(1,scope.in))

  @custom:
    type: "range"
    id: "custom"
    text: "as described below:"
    uiText: tr "~NODE-RELATION-EDIT.CUSTOM"
    postfixIco: "cus"
    formulaFrag: ""
    magnitude: 0
    gradual: 0
    func: (scope) ->
      return

  @added:
    type: "accumulator"
    id: "added"
    text: tr "~NODE-RELATION-EDIT.ADDED_TO"
    postfixIco: "added-to"
    formula: "+in"  # needs to be +in to differentiate from @transferred
    magnitude: 1  # triggers '+' relationship symbol
    gradual: 0
    func: (scope) ->
      return scope.in
    forDualAccumulator: false # used in link-relation-view#renderAccumulator

  @subtracted:
    type: "accumulator"
    id: "subtracted"
    text: tr "~NODE-RELATION-EDIT.SUBTRACTED_FROM"
    postfixIco: "subtracted-from"
    formula: "-in"
    magnitude: -1 # triggers '-' relationship symbol
    gradual: 0
    func: (scope) ->
      return -scope.in
    forDualAccumulator: false

  @transferred:
    type: "transfer"
    id: "transferred"
    text: tr "~NODE-RELATION-EDIT.TRANSFERRED_TO"
    postfixIco: "transferred"
    formula: "in"
    magnitude: 0
    gradual: 0
    func: (scope) ->
      return scope.in
    forDualAccumulator: true

  @all:
    type: "transfer-modifier"
    id: "all"
    text: tr "~NODE-RELATION-EDIT.ALL"
    postfixIco: "all"
    formula: "in"
    magnitude: 0
    gradual: 0
    func: (scope) ->
      return scope.in

  @most:
    type: "transfer-modifier"
    id: "most"
    text: tr "~NODE-RELATION-EDIT.MOST"
    postfixIco: "most"
    formula: "in * 0.75"
    magnitude: 0
    gradual: 0
    func: (scope) ->
      return scope.in * 0.75

  @half:
    type: "transfer-modifier"
    id: "half"
    text: tr "~NODE-RELATION-EDIT.HALF"
    postfixIco: "half"
    formula: "in * 0.5"
    magnitude: 0
    gradual: 0
    func: (scope) ->
      return scope.in * 0.5

  @some:
    type: "transfer-modifier"
    id: "some"
    text: tr "~NODE-RELATION-EDIT.SOME"
    postfixIco: "some"
    formula: "in * 0.25"
    magnitude: 0
    gradual: 0
    func: (scope) ->
      return scope.in * 0.25

  @aLittleBit:
    type: "transfer-modifier"
    id: "aLittleBit"
    text: tr "~NODE-RELATION-EDIT.A_LITTLE_BIT"
    postfixIco: "a-little-bit"
    formula: "in * 0.03"
    magnitude: 0
    gradual: 0
    func: (scope) ->
      return scope.in * 0.03

  @iconName: (incdec,amount)->
    "icon-#{incdec.prefixIco}-#{amount.postfixIco}"

  @basicVectors:
    increase: @increase
    decrease: @decrease

  @vectors:
    increase: @increase
    decrease: @decrease
    vary: @vary

  @scalars:
    aboutTheSame: @aboutTheSame
    aLot: @aLot
    aLittle: @aLittle
    moreAndMore: @moreAndMore
    lessAndLess: @lessAndLess

  @accumulators:
    added: @added
    subtracted: @subtracted
    transferred: @transferred

  @transferModifiers:
    all: @all
    most: @most
    half: @half
    some: @some
    aLittleBit: @aLittleBit

  @CreateRelation: (options) ->
    new Relationship(options)

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
    new Relationship({type: 'range', text: name, formula: formula, func: func, magnitude: magnitude, customData: existingData})

  @selectionsFromRelation: (relation) ->
    vector = _.find @vectors, (v) ->
      _.startsWith relation.formula, v.formulaFrag
    scalar = _.find @scalars, (s) ->
      _.endsWith relation.formula, s.formulaFrag
    accumulator = _.find @accumulators, (s) ->
      relation.formula is s.formula
    transferModifier = _.find @transferModifiers, (s) ->
      relation.formula is s.formula
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
    else if accumulator or transferModifier
      magnitude = (accumulator or transferModifier).magnitude
    {vector, scalar, accumulator, transferModifier, magnitude, gradual}

  @thicknessFromRelation: (relation) ->
    dt = 1
    switch relation.formula
      when @all.formula then 1 + 4 * dt
      when @most.formula then 1 + 3 * dt
      when @half.formula then 1 + 2 * dt
      when @some.formula then 1 + 1 * dt
      when @aLittleBit.formula then 1
      else 1

  # @isCustomRelationship: (vector) ->
  #  customRelationship = false
  #  if vector? and vector.id == @vary.id
  #    customRelationship = true
  #  customRelationship
