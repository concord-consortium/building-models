{div, h2, label, span, input, p, i, select, option} = React.DOM

tr = require "../utils/translate"

relation =
  increase:
    id: 0
    prefixIco: "inc"
    text: tr "~NODE-RELATION-EDIT.INCREASES"

  decrease:
    id: 1
    prefixIco: "dec"
    text: tr "~NODE-RELATION-EDIT.DECREASES"

  aboutTheSame:
    id: 0
    text: tr "~NODE-RELATION-EDIT.ABOUT_THE_SAME"
    postfixIco: "the-same"

  aLot:
    id: 1
    text: tr "~NODE-RELATION-EDIT.A_LOT"
    postfixIco: "a-lot"

  aLittle:
    id: 2
    text: tr "~NODE-RELATION-EDIT.A_LITTLE"
    postfixIco: "a-little"

  moreAndMore:
    id: 3
    text: tr "~NODE-RELATION-EDIT.MORE_AND_MORE"
    postfixIco: "more-and-more"

  lessAndLess:
    id: 4
    text: tr "~NODE-RELATION-EDIT.LESS_AND_LESS"
    postfixIco: "less-and-less"

  inconName: (incdec,amount)->
    "icon-#{incdec.prefixIco}-#{amount.postfixIco}"

relation.vectors = [relation.increase, relation.decrease]
relation.scalars = [
  relation.aboutTheSame
  relation.aLot
  relation.aLittle
  relation.moreAndMore
  relation.lessAndLess
]

module.exports = React.createClass

  displayName: 'LinkRelationView'

  getInitialState: ->
    increaseOrDecrease: relation.increase
    amount: relation.aboutTheSame

  getDefaultProps: ->
    link:
      targetNode:
        title: "default target node"
      sourceNode:
        title: "default source node"

  updateIncreaseOrDecrease: (evt)->
    id = parseInt evt.target.value
    selected = relation.vectors[id]
    @setState
      increaseOrDecrease: selected

  updateAmount: (evt)->
    id = parseInt evt.target.value
    selected = relation.scalars[id]
    @setState
      amount: selected

  renderIncreaseOrDecreaseSelect: ->
    selected_id = @state.increaseOrDecrease.id
    options = _.map relation.vectors, (opt) ->
      if opt.id is selected_id
        (option {value: opt.id, selected: 'true'}, opt.text)
      else
        (option {value: opt.id}, opt.text)
    (div {className: "bb-select"},
      (label {}, "#{@props.link.targetNode.title} ")
      (select {className:"", onChange: @updateIncreaseOrDecrease},
      options)
    )

  renderAmountSelect: ->
    selected_id = @state.amount.id
    options = _.map relation.scalars, (opt) ->
      if opt.id is selected_id
        (option {value: opt.id, selected: 'true'}, opt.text)
      else
        (option {value: opt.id}, opt.text)
    (div {className: "bb-select"},
      (label {}, "#{tr "~NODE-RELATION-EDIT.BY"} ")
      (select {className:"", onChange: @updateAmount},
        options
      )
    )

  render: ->
    classname = relation.inconName(@state.increaseOrDecrease, @state.amount)
    (div {className: 'link-relation-view'},
      (span {}, "As #{@props.link.sourceNode.title} increases … ")
      (div {className: 'inspector-content group'},
        (div {className: 'full'},
          @renderIncreaseOrDecreaseSelect()
        )
        (div {className: 'full'},
          @renderAmountSelect()
        )
        (i {className: "full chart center #{classname}"})
      )
    )
