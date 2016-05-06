{br, div, h2, label, span, input, p, i, select, option} = React.DOM

RelationFactory = require "../models/relation-factory"
SvgGraph        = React.createFactory require "./svg-graph-view"
tr              = require "../utils/translate"

Graph = React.createFactory React.createClass
  render: ->
    (SvgGraph {
      width: 130
      height: 130
      yLabel: @props.yAxis
      xLabel: @props.xAxis
      formula: @props.formula
      customData: @props.customData
      link: @props.link
      graphStore: @props.graphStore
    })

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

  getInitialState: ->
    selectedVector: null
    selectedScalar: null

  componentWillMount: ->
    if not @state.selectedVector? and not @props.link.relation.customData?
      {vector, scalar} = RelationFactory.selectionsFromRelation @props.link.relation
      selectedVector = vector
      selectedScalar = scalar
      @setState {selectedVector, selectedScalar}
      
  componentWillReceiveProps: (newProps) ->
    if @props.link isnt newProps.link
      @setState
        selectedVector: null
        selectedScalar: null

  updateRelation: ->
    selectedVector = @getVector()
    selectedScalar = @getScalar()
    if selectedVector? and RelationFactory.isCustomRelationship selectedVector
      selectedScalar = RelationFactory.custom
    @setState {selectedVector, selectedScalar}
    if not selectedScalar?
      selectedScalar = RelationFactory.unknown
    
    if selectedVector?
      link = @props.link
      existingData = link.relation.customData
      relation = RelationFactory.fromSelections(selectedVector, selectedScalar, existingData)
      @props.graphStore.changeLink(link, {relation: relation})

  getVector: ->
    id = parseInt @refs.vector.value
    RelationFactory.vectors[id]

  getScalar: ->
    if @refs.scalar
      id = parseInt @refs.scalar.value
      RelationFactory.scalars[id]

  renderVectorPulldown: (vectorSelection)->
    options = _.map RelationFactory.vectors, (opt, i) ->
      (option {value: opt.id, key: i}, opt.text)

    if not vectorSelection?
      options.unshift (option {key: "placeholder", value: "unselected", disabled: "disabled"},
        tr "~NODE-RELATION-EDIT.UNSELECTED")
      currentOption = "unselected"
    else
      currentOption = vectorSelection.id

    (div {className: "bb-select"},
      (span {}, "#{tr "~NODE-RELATION-EDIT.TO"} ")
      (select {value: currentOption, className:"", ref: "vector", onChange: @updateRelation},
      options)
    )
      
  renderScalarPulldown:(scalarSelection) ->
    options = _.map RelationFactory.scalars, (opt, i) ->
      (option {value: opt.id, key: i}, opt.text)
      
    if not scalarSelection?
      options.unshift (option {key: "placeholder", value: "unselected", disabled: "disabled"},
        tr "~NODE-RELATION-EDIT.UNSELECTED")
      currentOption = "unselected"
    else
      currentOption = scalarSelection.id

    disabled = "disabled" unless @state.selectedVector or scalarSelection?
    if @state.selectedVector
      if RelationFactory.isCustomRelationship @state.selectedVector
        (div {className: "bb-select"},
          (span {}, "#{tr "~NODE-RELATION-EDIT.CUSTOM"}")
        )
      else
        (div {className: "bb-select"},
          (span {}, "#{tr "~NODE-RELATION-EDIT.BY"} ")
          (select {value: currentOption, className:"", ref: "scalar", onChange: @updateRelation, disabled: disabled},
            options
          )
        )

  render: ->
    source = @props.link.sourceNode.title
    target = @props.link.targetNode.title
    {vector, scalar} = RelationFactory.selectionsFromRelation @props.link.relation

    vector ?= @state.selectedVector
    formula = @props.link.relation.formula
    if RelationFactory.isCustomRelationship(vector)
      formula = null
      
    (div {className: 'link-relation-view'},
      (div {className: 'top'},
        (QuantStart {source: source, target: target})
        (div {className: 'full'},
          @renderVectorPulldown(vector)
        )
        (div {className: 'full'},
          @renderScalarPulldown(scalar)
        )
      )
      (div {className: 'bottom'},
        (div {className: 'graph', id:'relation-graph'},
          (Graph {formula: formula, xAxis: source, yAxis: target, link: @props.link, customData: @props.link.relation.customData, graphStore: @props.graphStore})
        )
      )
    )
    

