{div, h2, label, input, select, option, optgroup, button} = React.DOM
tr = require "../utils/translate"
NodeInspectorTabs = React.createFactory require './inspector-tabs-view'
ColorPicker = React.createFactory require './color-picker-view'
module.exports = React.createClass

  displayName: 'NodeInspectorView'

  changeTitle: (e) ->
    @props.onNodeChanged? @props.node, e.target.value, @props.node.image

  changeImage: (e) ->
    @props.onNodeChanged? @props.node, @props.node.title, e.target.value

  addRemote: (e) ->
    src = $.trim(@refs.remoteUrl?.getDOMNode().value or '')
    if src.length > 0
      img = new Image
      img.onload = =>
        @props.onNodeChanged? @props.node, @props.node.title, src
      img.onerror = =>
        alert "Sorry, could not load #{src}"
        @refs.remoteUrl.getDOMNode().focus()
      img.src = src

  render: ->
    builtInNodes = []
    droppedNodes = []
    remoteNodes = []
    tabs = [tr('design'), tr('define')]
    selected = tr('design')

    for node, i in @props.protoNodes
      if not node.image.match /^(https?|data):/
        builtInNodes.push node
      else if node.image.match /^data:/
        droppedNodes.push node
      else if node.image.match /^https?:/
        remoteNodes.push node

    (div {className: 'node-inspector-view'},
      (NodeInspectorTabs {tabs: tabs, selected: selected} )
      (div {className: 'node-inspector-content'},
        (div {className: 'edit-row'},
          (label {htmlFor: 'title'}, tr "~NODE-EDIT.TITLE")
          (input {type: 'text', name: 'title', value: @props.node.title, onChange: @changeTitle})
        )
        (div {className: 'edit-row'},
          (label {htmlFor: 'color'}, tr "~NODE-EDIT.COLOR")
          (ColorPicker {type: 'text', name: 'title', value: @props.node.title, onChange: @changeTitle})
        )
        (div {className: 'edit-row'},
          (label {htmlFor: 'image'}, tr "~NODE-EDIT.IMAGE")
          (select {name: 'image', value: @props.node.image, onChange: @changeImage},
            (optgroup {label: tr "~NODE-EDIT.BUILT_IN"},
              for node, i in builtInNodes
                (option {key: i, value: node.image}, if node.title.length > 0 then node.title else '(none)')
            )
            if droppedNodes.length > 0
              (optgroup {label: tr "~NODE-EDIT.DROPPED" },
                for node, i in droppedNodes
                  (option {key: i, value: node.image}, node.title or node.image)
              )
            (optgroup {label: 'Remote'},
              for node, i in remoteNodes
                (option {key: i, value: node.image}, node.image)
              (option {key: i, value: '#remote'},
                tr "~NODE-EDIT.ADD_REMOTE"
              )
            )
          )
        )
        if @props.node.image is '#remote'
          (div {},
            (div {className: 'edit-row'},
              (label {htmlFor: 'remoteUrl'}, 'URL')
              (input {type: 'text', ref: 'remoteUrl', name: 'remoteUrl', placeholder: 'Remote image url'})
            )
            (div {className: 'edit-row'},
              (label {htmlFor: 'save'}, '')
              (button {name: 'save', onClick: @addRemote}, 'Add Remote Image')
            )
          )
      )
    )
