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
      link: @props.link
      graphStore: @props.graphStore
    })

module.exports = LinkRelationView = React.createClass

  displayName: 'LinkRelationView'

  getDefaultProps: ->
    link:
      targetNode:
        title: "default target node"
      sourceNode:
        title: "default source node"

  getInitialState: ->
    selectedDescriptor: null
    selectedVector: null
    selectedScalar: null
    selectedVectorHasChanged: false

  componentWillMount: ->
    if not @state.selectedVector?
      @updateState(@props)
    else if @props.link.relation.customData?
      selectedDescriptor = RelationFactory.descriptorIncrease
      selectedVector = RelationFactory.vary
      selectedScalar = RelationFactory.custom
      @setState {selectedDescriptor, selectedVector, selectedScalar}
      
  componentWillReceiveProps: (newProps) ->
    if @props.link isnt newProps.link
      @updateState(newProps)

  updateState: (props) ->
    {vector, scalar} = RelationFactory.selectionsFromRelation props.link.relation
    descriptor = @state.selectedDescriptor
    if props.link.relation.customData?
      descriptor = RelationFactory.descriptorIncrease
      vector = RelationFactory.vary
      scalar = RelationFactory.custom
    @setState
      selectedDescriptor: descriptor
      selectedVector: vector
      selectedScalar: scalar

  updateDescriptor: ->
    id = parseInt @refs.descriptor.value
    newDescriptor = RelationFactory.descriptors[id]
    @setState
      selectedDescriptor: newDescriptor

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

  renderDescriptorPulldown: (descriptorSelection) ->
    options = _.map RelationFactory.descriptors, (opt, i) ->
      (option {value: opt.id, key: i}, opt.text)
    descriptor = descriptorSelection
    if not descriptorSelection?
      descriptor = RelationFactory.descriptorIncrease
    (select {value: descriptor.id, className: "descriptor", ref: "descriptor", onChange: @updateDescriptor},
      options)
    
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
      if @state.selectedVector.isCustomRelationship
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
    formula = @props.link.relation.formula
    
    (div {className: 'link-relation-view'},
      (div {className: 'top'},
        (div {},
          @renderDescriptorPulldown(@state.selectedDescriptor)
          (span {className: "source"}, source)
          (br {})
          (span {}, " #{tr "~NODE-RELATION-EDIT.CAUSES"} ")
          (span {className: "target"}, target)
        )
        (div {className: 'full'},
          @renderVectorPulldown(@state.selectedVector)
        )
        (div {className: 'full'},
          @renderScalarPulldown(@state.selectedScalar)
        )
      )
      (div {className: 'bottom'},
        (div {className: 'graph', id:'relation-graph'},
          (Graph {xAxis: source, yAxis: target, link: @props.link, graphStore: @props.graphStore})
        )
      )
      if @props.link.relation.isCustomRelationship
        (div {className: 'graph-hint'},
          (span {}, "#{tr "~NODE-RELATION-EDIT.CUSTOM_HINT"} ")
        )
    )
    

