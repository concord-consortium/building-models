{div, h2, label, span, input, p, i, select, option} = React.DOM

Relationship = require "../models/relationship"
tr = require "../utils/translate"

module.exports = React.createClass

  displayName: 'LinkRelationView'

  getInitialState: ->
    increaseOrDecrease: Relationship.increase
    amount: Relationship.aboutTheSame

  getDefaultProps: ->
    link:
      targetNode:
        title: "default target node"
      sourceNode:
        title: "default source node"

  updateIncreaseOrDecrease: (evt)->
    id = parseInt evt.target.value
    selected = Relationship.vectors[id]
    @setState
      increaseOrDecrease: selected

  updateAmount: (evt)->
    id = parseInt evt.target.value
    selected = Relationship.scalars[id]
    @setState
      amount: selected

  renderIncreaseOrDecreaseSelect: ->
    selected_id = @state.increaseOrDecrease.id
    options = _.map Relationship.vectors, (opt) ->
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
    options = _.map Relationship.scalars, (opt) ->
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
    classname = Relationship.inconName(@state.increaseOrDecrease, @state.amount)
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
