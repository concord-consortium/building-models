{br, div, h2, label, span, input, p, i, select, option} = React.DOM

RelationFactory = require "../models/relation-factory"
SvgGraph        = React.createFactory require "./svg-graph-view"
tr              = require "../utils/translate"


Graph = React.createFactory React.createClass
  render: ->
    (div {className: 'graph'},
      (SvgGraph {
        width: 130
        height: 130
        yLabel: @props.yAxis
        xLabel: @props.xAxis
        formula: @props.formula
      })
    )

QuantStart = React.createFactory React.createClass
  render: ->
    start = tr "~NODE-RELATION-EDIT.SEMI_QUANT_START"
    (div {},
      (span {}, "#{tr "~NODE-RELATION-EDIT.AN_INCREASE_IN"} ")
      (span {className: "source"}, @props.source)
      (br {})
      (span {}, " #{tr "~NODE-RELATION-EDIT.CAUSES"} ")
      (span {className: "target"}, @props.target)
    )

module.exports = LinkRelationView = React.createClass

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
    id = parseInt @refs.vector.value
    RelationFactory.vectors[id]

  getScalar: ->
    id = parseInt @refs.scalar.value
    RelationFactory.scalars[id]

  renderVector: (increaseOrDecrease)->
    selected_id = increaseOrDecrease.id
    options = _.map RelationFactory.vectors, (opt) ->
      if opt.id is selected_id
        (option {value: opt.id, selected: 'true'}, opt.text)
      else
        (option {value: opt.id}, opt.text)
    (div {className: "bb-select"},
      (span {}, "#{tr "~NODE-RELATION-EDIT.TO"} ")
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
      (span {}, "#{tr "~NODE-RELATION-EDIT.BY"} ")
      (select {className:"", ref: "scalar", onChange: @updateRelation},
        options
      )
    )

  render: ->
    source = @props.link.sourceNode.title
    target = @props.link.targetNode.title
    {vector, scalar} = RelationFactory.selectionsFromRelation @props.link.relation
    formula = @props.link.relation.formula
    (div {className: 'link-relation-view'},
      (div {className: 'top'},
        (QuantStart {source: source, target: target})
        (div {className: 'full'},
          @renderVector(vector)
        )
        (div {className: 'full'},
          @renderScalar(scalar)
        )
      )
      (div {className: 'bottom'},
        (Graph {formula: formula, xAxis: source, yAxis: target})
      )
    )
