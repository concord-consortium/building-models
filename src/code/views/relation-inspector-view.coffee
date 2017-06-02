LinkRelationView = React.createFactory require "./link-relation-view"
RelationFactory = require "../models/relation-factory"
TabbedPanel = React.createFactory require './tabbed-panel-view'
Tabber = require './tabbed-panel-view'
tr = require "../utils/translate"

inspectorPanelStore = require '../stores/inspector-panel-store'
graphStore = require '../stores/graph-store'

{div, h2, label, span, input, p, i, select, option} = React.DOM

module.exports = RelationInspectorView = React.createClass

  displayName: 'RelationInspectorView'

  # listen to graphStore so that the tab for the link will re-render when the link is fully defined
  # (link-relation-view uses @props.graphStore.changeLink() to update the link)
  mixins: [ inspectorPanelStore.mixin, graphStore.mixin ]

  renderTabforLink: (link) ->
    relationView = (LinkRelationView {link: link, graphStore: @props.graphStore})
    label = link.sourceNode.title
    {vector, scalar, accumulator, transferModifier} = RelationFactory.selectionsFromRelation link.relation
    isFullyDefined = (link.relation.isDefined and vector? and scalar?) or link.relation.customData? or accumulator? or transferModifier?

    (Tabber.Tab {label: label, component: relationView, defined: isFullyDefined})

  onTabSelected: (index) ->
    inspectorPanelStore.actions.openInspectorPanel 'relations', {link: @props.node.inLinks()?[index]}

  onMethodSelected: (evt) ->
    graphStore.store.changeNode({ combineMethod: evt.target.value }, @props.node)

  renderNodeDetailsInspector: ->
    inputCount = @props.node.inLinks()?.length ? 0
    return null unless inputCount > 1

    method = @props.node.combineMethod ? 'average'
    (div { className: 'node-details-inspector', key: 'details' }, [
      tr "~NODE-RELATION-EDIT.COMBINATION_METHOD"
      (select { key: 0, value: method, onChange: @onMethodSelected }, [
        (option {value: 'average', key: 1},
          tr "~NODE-RELATION-EDIT.ARITHMETIC_MEAN")
        (option {value: 'product', key: 2},
          tr "~NODE-RELATION-EDIT.SCALED_PRODUCT")
      ])
    ])

  renderNodeRelationInspector: ->
    selectedTabIndex = 0
    tabs = _.map @props.node.inLinks(), (link, i) =>
      selectedTabIndex = i if (@state.selectedLink is link)
      @renderTabforLink(link)
    (div {className:'relation-inspector'},
      (TabbedPanel {
        tabs: tabs
        selectedTabIndex: selectedTabIndex
        onTabSelected: @onTabSelected
        onRenderBelowTabsComponent: @renderNodeDetailsInspector
      })
    )

  renderLinkRelationInspector: ->
    (div {className:'relation-inspector'})

  render: ->
    if @props.node
      @renderNodeRelationInspector()
    else
      @renderLinkRelationInspector()
