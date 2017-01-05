{br, div, h2, label, span, input, p, i, select, option, textarea} = React.DOM

RelationFactory = require "../models/relation-factory"
SvgGraph        = React.createFactory require "./svg-graph-view"
tr              = require "../utils/translate"
autosize        = require "autosize"

Graph = React.createFactory React.createClass
  render: ->
    (SvgGraph {
      width: 130
      height: 130
      yLabel: @props.yAxis
      xLabel: @props.xAxis
      link: @props.link
      graphStore: @props.graphStore
    })

QuantStart = React.createFactory React.createClass
  render: ->
    start = tr "~NODE-RELATION-EDIT.SEMI_QUANT_START"
    (div {style: {width: "95%"}},
      (span {}, "#{tr "~NODE-RELATION-EDIT.AN_INCREASE_IN"} ")
      (span {className: "source"}, @props.source)
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
    selectedVectorHasChanged: false

  componentWillMount: ->
    if not @state.selectedVector?
      @updateState(@props)
    else if @props.link.relation.customData?
      selectedVector = RelationFactory.vary
      selectedScalar = RelationFactory.custom
      @setState {selectedVector, selectedScalar}

  componentDidMount: ->
    autosize(@refs.reasoning)

  componentWillReceiveProps: (newProps) ->
    if @props.link isnt newProps.link
      @updateState(newProps)

      # ensure reasoning value has been set, as onblur not triggered
      @props.link.reasoning = @refs.reasoning.value

    # a hack to update uncontrolled textarea when viewing new links
    @refs.reasoning.value = newProps.link.reasoning

  updateState: (props) ->
    {vector, scalar} = RelationFactory.selectionsFromRelation props.link.relation
    if props.link.relation.customData?
      vector = RelationFactory.vary
      scalar = RelationFactory.custom
    @setState
      selectedVector: vector
      selectedScalar: scalar

  updateRelation: ->
    selectedVector = @getVector()
    selectedScalar = @getScalar()
    if selectedVector? and selectedVector.isCustomRelationship
      selectedScalar = RelationFactory.custom
    @setState {selectedVector, selectedScalar}

    if selectedVector?
      link = @props.link
      existingData = link.relation.customData
      relation = RelationFactory.fromSelections(selectedVector, selectedScalar, existingData)
      relation.isDefined = selectedVector? and selectedScalar?
      if not selectedVector.isCustomRelationship
        relation.customData = null
      else
        relation.isDefined = link.relation.customData?
        relation.isCustomRelationship = true

      @props.graphStore.changeLink(link, {relation: relation})

  updateReasoning: ->
    @props.graphStore.changeLink(@props.link, {reasoning: @refs.reasoning.value})

  getVector: ->
    id = parseInt @refs.vector.value
    newVector = RelationFactory.vectors[id]

    selectedVectorHasChanged = false
    if @state.selectedVector and id != @state.selectedVector.id
      selectedVectorHasChanged = true

    @setState { selectedVectorHasChanged }
    RelationFactory.vectors[id]

  getScalar: ->
    if @refs.scalar
      id = parseInt @refs.scalar.value
      RelationFactory.scalars[id]
    else
      undefined

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

    # place dropdown but hide it if we haven't selected vector (to keep spacing)
    style = if @state.selectedVector then {} else {opacity: 0}

    if @state.selectedVector?.isCustomRelationship
      (div {className: "bb-select", style: style},
        (span {}, "#{tr "~NODE-RELATION-EDIT.CUSTOM"}")
      )
    else
      (div {className: "bb-select", style: style},
        (span {}, "#{tr "~NODE-RELATION-EDIT.BY"} ")
        (select {value: currentOption, className:"", ref: "scalar", onChange: @updateRelation},
          options
        )
      )

  render: ->
    source = @props.link.sourceNode.title
    target = @props.link.targetNode.title

    (div {className: 'link-relation-view'},
      (div {className: 'top'},
        (QuantStart {source: source, target: target})
        (div {className: 'full'},
          @renderVectorPulldown(@state.selectedVector)
        )
        (div {className: 'full'},
          @renderScalarPulldown(@state.selectedScalar)
        )
      )
      (div {className: 'bottom'},
        (div {className: 'graph', id:'relation-graph'},
          (Graph
            xAxis: source
            yAxis: target
            link: @props.link
            graphStore: @props.graphStore
          )
        )
      )

      (div {className: 'bottom'},
        (div {},
          (span {}, "#{tr "~NODE-RELATION-EDIT.BECAUSE"} ")
        )
        (textarea
          defaultValue: @props.link.reasoning
          placeholder: tr "~NODE-RELATION-EDIT.BECAUSE_PLACEHOLDER"
          onBlur: @updateReasoning
          ref: 'reasoning'
          className: 'full'
          rows: 3
          style: { overflowY: "scroll", resize: "none"}
        )
      )
    )


