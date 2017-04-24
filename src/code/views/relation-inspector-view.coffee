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
    {vector, scalar} = RelationFactory.selectionsFromRelation link.relation
    isFullyDefined = (link.relation.isDefined and vector? and scalar?) or link.relation.customData?

    (Tabber.Tab {label: label, component: relationView, defined: isFullyDefined})

  renderNodeRelationInspector: ->
    selectedTabIndex = 0
    tabs = _.map @props.node.inLinks(), (link, i) =>
      selectedTabIndex = i if (@state.selectedLink is link)
      @renderTabforLink(link)
    (div {className:'relation-inspector'},
      (TabbedPanel {tabs: tabs, selectedTabIndex: selectedTabIndex})
    )

  renderLinkRelationInspector: ->
    (div {className:'relation-inspector'})

  render: ->
    if @props.node
      @renderNodeRelationInspector()
    else
      @renderLinkRelationInspector()
