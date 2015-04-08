ProtoNodeView = React.createFactory require './proto-node-view'

{div} = React.DOM

module.exports = React.createClass

  displayName: 'NodeWell'

  getInitialState: ->
    nodes: []

  render: ->
    (div {className: 'node-well'},
      for node, i in @props.protoNodes
        (ProtoNodeView {key: i, image: node.image, title: node.title, onNodeClicked: @props.onNodeClicked})
    )
