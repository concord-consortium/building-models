{br, div, h2, label, span, input, p, i, select, option, textarea} = React.DOM

RelationFactory = require "../models/relation-factory"
SvgGraph        = React.createFactory require "./svg-graph-view"
tr              = require "../utils/translate"
autosize        = require "autosize"
SimulationStore = require '../stores/simulation-store'

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

  mixins: [SimulationStore.mixin]

  getDefaultProps: ->
    link:
      targetNode:
        title: "default target node"
      sourceNode:
        title: "default source node"

  getInitialState: ->
    status = @checkStatus()
    return {
      selectedVector: null
      selectedScalar: null
      selectedVectorHasChanged: false
      selectedAccumulator: null
      selectedTransfer: null
      isAccumulator: status.isAccumulator
      isDualAccumulator: status.isDualAccumulator
      isTranser: status.isTransfer
    }

  componentWillMount: ->
    if @state.isAccumulator or @state.isTransfer or not @state.selectedVector?
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

  checkStatus: ->
    {sourceNode, targetNode} = @props.link
    status =
      isAccumulator: targetNode.isAccumulator
      isDualAccumulator: sourceNode.isAccumulator and targetNode.isAccumulator
      isTransfer: targetNode.isTransfer and targetNode.transferLink?.sourceNode is sourceNode

  updateState: (props) ->
    status = @checkStatus()
    {vector, scalar, accumulator, transfer} = RelationFactory.selectionsFromRelation props.link.relation
    if props.link.relation.customData?
      vector = RelationFactory.vary
      scalar = RelationFactory.custom
    @setState
      selectedVector: vector
      selectedScalar: scalar
      selectedAccumulator: accumulator
      selectedTransfer: transfer
      isAccumulator: status.isAccumulator
      isDualAccumulator: status.isDualAccumulator
      isTransfer: status.isTransfer

  updateRelation: ->
    if @state.isAccumulator
      selectedAccumulator = @getAccumulator()
      @setState {selectedAccumulator}

      if selectedAccumulator?
        link = @props.link
        relation = RelationFactory.fromAccumulator(selectedAccumulator)
        relation.isDefined = true
        @props.graphStore.changeLink(link, {relation: relation})
    else if @state.isTransfer
      selectedTransfer = @getTransfer()
      @setState {selectedTransfer}

      if selectedTransfer?
        link = @props.link
        relation = RelationFactory.fromTransfer(selectedTransfer)
        relation.isDefined = true
        @props.graphStore.changeLink(link, {relation: relation})
    else
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

  getAccumulator: ->
    id = parseInt @refs.accumulator.value
    RelationFactory.accumulators[id]

  getTransfer: ->
    id = parseInt @refs.transfer.value
    RelationFactory.transfers[id]

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
      (option {value: opt.id, key: i}, opt.uiText)

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
      (option {value: opt.id, key: i}, opt.uiText)

    if not scalarSelection?
      options.unshift (option {key: "placeholder", value: "unselected", disabled: "disabled"},
        tr "~NODE-RELATION-EDIT.UNSELECTED")
      currentOption = "unselected"
    else
      currentOption = scalarSelection.id

    # place dropdown but hide it if we haven't selected vector (to keep spacing)
    visClass = if @state.selectedVector then ' visible' else ' hidden'

    if @state.selectedVector?.isCustomRelationship
      (div {className: "bb-select#{visClass}"},
        (span {}, "#{tr "~NODE-RELATION-EDIT.CUSTOM"}")
      )
    else
      (div {className: "bb-select#{visClass}"},
        (span {}, "#{tr "~NODE-RELATION-EDIT.BY"} ")
        (select {value: currentOption, className:"", ref: "scalar", onChange: @updateRelation},
          options
        )
      )

  renderAccumulator: (source, target) ->
    options = _.map RelationFactory.singleAccumulators, (opt, i) ->
      (option {value: opt.id, key: opt.id}, opt.text)
    if @props.link.sourceNode.isAccumulator and @props.link.targetNode.isAccumulator
      _.each RelationFactory.isDualAccumulators, (opt, i) ->
        options.push (option {value: opt.id, key: opt.id}, opt.text)

    if not @state.selectedAccumulator
      options.unshift (option {key: "placeholder", value: "unselected", disabled: "disabled"},
        tr "~NODE-RELATION-EDIT.UNSELECTED")
      currentOption = "unselected"
    else
      currentOption = @state.selectedAccumulator.id

    (div {className: 'top'},
      (span {className: "source"}, source)
      (span {}, " #{tr "~NODE-RELATION-EDIT.IS"} ")
      (div {},
        (select {value: currentOption, ref: "accumulator", onChange: @updateRelation},
          options
        )
      )
      (span {className: "target"}, target)
      (span {}, " #{tr "~NODE-RELATION-EDIT.EACH"} ")
      (span {}, @state.stepUnits.toLowerCase())
    )

  renderTransfer: (source, target) ->
    options = _.map RelationFactory.transfers, (opt, i) ->
      (option {value: opt.id, key: opt.id}, opt.text)

    if not @state.selectedTransfer
      options.unshift (option {key: "placeholder", value: "unselected", disabled: "disabled"},
        tr "~NODE-RELATION-EDIT.UNSELECTED")
      currentOption = "unselected"
    else
      currentOption = @state.selectedTransfer.id

    (div {className: 'top'},
      (select {value: currentOption, ref: "transfer", onChange: @updateRelation},
        options
      )
      (span {}, " #{tr "~NODE-RELATION-EDIT.OF"} ")
      (span {className: "source"}, source)
      (span {}, " ")
      (span {className: "target"}, target)
      (span {}, " #{tr "~NODE-RELATION-EDIT.EACH"} ")
      (span {}, @state.stepUnits.toLowerCase())
    )

  renderNonAccumulator: (source, target) ->
    (div {},
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
    )

  render: ->
    source = @props.link.sourceNode.title
    target = @props.link.targetNode.title

    (div {className: 'link-relation-view'},
      if @state.isAccumulator
        @renderAccumulator(source, target)
      else if @state.isTransfer
        @renderTransfer(source, target)
      else
        @renderNonAccumulator(source, target)
      (div {className: 'bottom'},
        (div {},
          (span {}, "#{tr "~NODE-RELATION-EDIT.BECAUSE"} ")
        )
        (textarea
          defaultValue: @props.link.reasoning
          placeholder: tr "~NODE-RELATION-EDIT.BECAUSE_PLACEHOLDER"
          onChange: @updateReasoning
          ref: 'reasoning'
          className: 'full'
          rows: 3
          style: { overflowY: "scroll", resize: "none"}
        )
      )
    )


