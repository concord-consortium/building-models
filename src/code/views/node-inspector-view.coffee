{div, h2, label, input, select, option, optgroup, button, i} = React.DOM
tr = require "../utils/translate"
ColorPicker = React.createFactory require './color-picker-view'
ImagePickerView = React.createFactory require './image-picker-view'
module.exports = React.createClass

  displayName: 'NodeInspectorView'
  mixins: [require "../mixins/node-title"]
  changeTitle: (e) ->
    newTitle = @cleanupTitle(e.target.value)
    @props.onNodeChanged? @props.node, {title: newTitle}

  changeImage: (node) ->
    @props.onNodeChanged? @props.node, {image: node.image, paletteItem: node.uuid}

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
    displayTitle = @displayTitleForInput(@props.node.title)

    (div {className: 'node-inspector-view'},
      # previous design comps:
      # (InspectorTabs {tabs: tabs, selected: selected} )
      (div {className: 'inspector-content'},
        (div {className: 'edit-row'},
          (label {htmlFor: 'title'}, tr "~NODE-EDIT.TITLE")
          (input {type: 'text', name: 'title', defaultValue: displayTitle, placeholder: @titlePlaceholder(),  onChange: @changeTitle})
        )
        (div {className: 'edit-row'},
          (label {htmlFor: 'color'}, tr "~NODE-EDIT.COLOR")
          (ColorPicker {selected: @props.node.color,  onChange: @changeColor})
        )
        (div {className: 'edit-row'},
          (label {htmlFor: 'image'}, tr "~NODE-EDIT.IMAGE")
          (ImagePickerView {selected: @props.node, onChange: @changeImage})
        )
        (div {className: 'edit-row'},
          (label {className: 'node-delete', onClick: @delete},
            (i {className: "icon-codap-trash"})
            tr("~NODE-EDIT.DELETE")
          )
        )
      )
    )
