ProtoNodeView = React.createFactory require './proto-node-view'

{div} = React.DOM

protoNodes = [
  {
    'title': 'Egg',
    'image': 'img/nodes/egg.png'
  },
  {  
    'title': 'Chick'
    'image': 'img/nodes/chick.jpg'
  },
  {
    'title': 'Chicken'
    'image': 'img/nodes/chicken.jpg'
  },
  {
    'title': ''
    'image': ''
  }
];

module.exports = React.createClass

  displayName: 'NodeWell'

  getInitialState: ->
    nodes: []
 
  render: ->
    (div {className: 'node-well'},
      for node, i in protoNodes
        (ProtoNodeView {key: i, image: node.image, title: node.title})
    )
