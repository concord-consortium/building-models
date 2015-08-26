LinkRelationView = React.createFactory require "./link-relation-view"
TabbedPanel = React.createFactory require './tabbed-panel-view'
Tabber = require './tabbed-panel-view'
tr = require "../utils/translate"

LinkStore        = require '../models/link-manager'

{div, h2, label, span, input, p, i, select, option} = React.DOM

module.exports = React.createClass

  displayName: 'RelationInspectorView'

  mixins: [ LinkStore.mixin ]

  renderTabforLink: (link) ->
    relationView = (LinkRelationView {link: link, linkManager: @props.linkManager})
    (Tabber.Tab {label: (link.sourceNode.title), component: relationView})

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
