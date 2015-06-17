LinkRelationView = React.createFactory require "./link-relation-view"
TabbedPanel = React.createFactory require './tabbed-panel-view'
Tabber = require './tabbed-panel-view'
tr = require "../utils/translate"

{div, h2, label, span, input, p, i, select, option} = React.DOM




module.exports = React.createClass

  displayName: 'RelationInspectorView'

  getDefaultProps: ->
    node =
      title: "population"

    node.inLinks = ->
      link1 =
        targetNode: node
        sourceNode:
          title: "source node one"
      link2 =
        targetNode: node
        sourceNode:
          title: "second node two"
      [link1, link2]
    node


  renderTabforLink: (link) ->
    relationView = (LinkRelationView {link: link})
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
    (div {className:'relation-inspector'},
      (div {className: 'link-relation-inspector'}, "TBD: No link relation panel")
      (div {className: "bottom-pane"},
        (p {}, tr "~NODE-RELATION-EDIT.DEFINING_WITH_WORDS")
      )
    )
  render: ->
    if @props.node
      @renderNodeRelationInspector()
    else
      @renderLinkRelationInspector()
