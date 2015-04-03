{div, h2, label, input} = React.DOM

module.exports = React.createClass

  displayName: 'NodeEdit'

  changeTitle: (e) ->
    @props.onNodeChanged? @props.node, e.target.value, @props.node.image

  changeImage: (e) ->
    @props.onNodeChanged? @props.node, @props.node.title, e.target.value

  render: ->
    if @props.node
      (div {className: 'node-edit-view'},
        (h2 {}, @props.node.title)
        (div {className: 'edit-row'},
          (label {name: 'title'}, 'Title')
          (input {type: 'text', name: 'title', value: @props.node.title, onChange: @changeTitle})
        )
        (div {className: 'edit-row'},
          (label {name: 'image'}, 'Image')
          (input {type: 'text', name: 'image', value: @props.node.image, onChange: @changeImage})
        )
      )
    else
      (div {className: 'node-edit-view hidden'})
