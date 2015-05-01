{div, h2, label, input, select, option, optgroup, button} = React.DOM
tr = require "../utils/translate"
InspectorTabs = React.createFactory require './inspector-tabs-view'
ColorPicker = React.createFactory require './color-picker-view'
ImagePickerView = React.createFactory require './image-picker-view'
module.exports = React.createClass

  displayName: 'NodeInspectorView'

  changeTitle: (e) ->
    @props.onNodeChanged? @props.node, {title: e.target.value}

  changeImage: (node) ->
    @props.onNodeChanged? @props.node, {image: node.image}

  changeColor: (color) ->
    @props.onNodeChanged? @props.node, {color: color}

  delete: (e) ->
    @props.onNodeDelete? @props.node

  render: ->
    builtInNodes = []
    droppedNodes = []
    remoteNodes = []
    tabs = [tr('design'), tr('define')]
    selected = tr('design')

    (div {className: 'node-inspector-view'},
      (InspectorTabs {tabs: tabs, selected: selected} )
      (div {className: 'node-inspector-content'},
        (div {className: 'edit-row'},
          (label {htmlFor: 'title'}, tr "~NODE-EDIT.TITLE")
          (input {type: 'text', name: 'title', value: @props.node.title, onChange: @changeTitle})
        )
        (div {className: 'edit-row'},
          (label {htmlFor: 'color'}, tr "~NODE-EDIT.COLOR")
          (ColorPicker {selected: @props.node.color,  onChange: @changeColor})
        )
        (div {className: 'edit-row'},
          (label {htmlFor: 'image'}, tr "~NODE-EDIT.IMAGE")
          (ImagePickerView {nodes:@props.protoNodes, selected: @props.node, onChange: @changeImage})
        )
        (div {className: 'edit-row'},
          (label {className: 'node-delete', onClick: @delete}, tr("~NODE-EDIT.DELETE"))
        )
      )
    )
