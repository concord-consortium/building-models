{div, h2, label, span, input, p, i, select, option} = React.DOM

RelationFactory = require "../models/relation-factory"
tr = require "../utils/translate"

module.exports = React.createClass

  displayName: 'LinkRelationView'

  getDefaultProps: ->
    link:
      targetNode:
        title: "default target node"
      sourceNode:
        title: "default source node"

  updateRelation: ->
    vector   = @getVector()
    scalar   = @getScalar()

    relation = RelationFactory.fromSelections(vector, scalar)
    link = @props.link
    @props.graphStore.changeLink(link, {relation: relation})

  getVector: ->
    id = parseInt React.findDOMNode(@refs.vector).value
    RelationFactory.vectors[id]

  getScalar: ->
    id = parseInt React.findDOMNode(@refs.scalar).value
    RelationFactory.scalars[id]

  renderVector: (increaseOrDecrease)->
    selected_id = increaseOrDecrease.id
    options = _.map RelationFactory.vectors, (opt) ->
      if opt.id is selected_id
        (option {value: opt.id, selected: 'true'}, opt.text)
      else
        (option {value: opt.id}, opt.text)
    (div {className: "bb-select"},
      (label {}, "#{@props.link.targetNode.title} ")
      (select {className:"", ref: "vector", onChange: @updateRelation},
      options)
    )

  renderScalar:(amount) ->
    selected_id = amount.id
    options = _.map RelationFactory.scalars, (opt) ->
      if opt.id is selected_id
        (option {value: opt.id, selected: 'true'}, opt.text)
      else
        (option {value: opt.id}, opt.text)
    (div {className: "bb-select"},
      (label {}, "#{tr "~NODE-RELATION-EDIT.BY"} ")
      (select {className:"", ref: "scalar", onChange: @updateRelation},
        options
      )
    )

  render: ->
    {vector, scalar} = RelationFactory.selectionsFromRelation @props.link.relation
    classname = RelationFactory.iconName(vector, scalar)
    (div {className: 'link-relation-view'},
      (span {}, "As #{@props.link.sourceNode.title} increases … ")
      (div {className: 'inspector-content group'},
        (div {className: 'full'},
          @renderVector(vector)
        )
        (div {className: 'full'},
          @renderScalar(scalar)
        )
        (i {className: "full chart center #{classname}"})
      )
    )
