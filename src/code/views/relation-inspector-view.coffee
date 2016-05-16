LinkRelationView = React.createFactory require "./link-relation-view"
RelationFactory = require "../models/relation-factory"
TabbedPanel = React.createFactory require './tabbed-panel-view'
Tabber = require './tabbed-panel-view'
tr = require "../utils/translate"

graphStore        = require '../stores/graph-store'

{div, h2, label, span, input, p, i, select, option} = React.DOM

module.exports = RelationInspectorView = React.createClass

  displayName: 'RelationInspectorView'

  mixins: [ graphStore.mixin ]

  renderTabforLink: (link) ->
    relationView = (LinkRelationView {link: link, graphStore: @props.graphStore})
    label = link.sourceNode.title
    {vector, scalar} = RelationFactory.selectionsFromRelation link.relation
    isFullyDefined = (link.relation.isDefined and vector? and scalar?) or link.relation.customData?
    #if vector? and vector.isCustomRelationship
    #  isFullyDefined = link.relation.customData?
    # console.log(link.relation)
    (Tabber.Tab {label: label, component: relationView, defined: isFullyDefined})

  renderNodeRelationInspector: ->
    tabs = _.map @props.node.inLinks(), (link) => @renderTabforLink(link)
    (div {className:'relation-inspector'},
      (TabbedPanel {tabs: tabs})
      (div {className: "bottom-pane"},
        (p {}, tr "~NODE-RELATION-EDIT.DEFINING_WITH_WORDS")
      )
    )

  renderLinkRelationInspector: ->
    (div {className:'relation-inspector'})
    # TODO: build this later.
    #   (div {className: 'link-relation-inspector'}, "TBD: No link relation panel")
    #   (div {className: "bottom-pane"},
    #     (p {}, tr "~NODE-RELATION-EDIT.DEFINING_WITH_WORDS")
    #   )
    # )
  render: ->
    if @props.node
      @renderNodeRelationInspector()
    else
      @renderLinkRelationInspector()
