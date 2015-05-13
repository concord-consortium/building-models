dropImageHandler = require '../utils/drop-image-handler'

tr = require '../utils/translate'

{div, p} = React.DOM

module.exports = React.createClass
  displayName: 'DropZone'

  getInitialState: ->
    canDrop: false

  onDragOver: (e) ->
    if not @state.canDrop
      @setState canDrop: true
    e.preventDefault()

  onDragLeave: (e) ->
    @setState canDrop: false
    e.preventDefault()

  onDrop: (e) ->
    @setState canDrop: false
    e.preventDefault()

    # get the files
    dropImageHandler e, (file) =>
      @props.dropped file

  render: ->
    (div {className: "dropzone #{if @state.canDrop then 'can-drop' else ''}", onDragOver: @onDragOver, onDrop: @onDrop, onDragLeave: @onDragLeave},
      (p {className: 'header'}, @props.header or (tr "~DROPZONE.DROP_IMAGES_HERE"))
      (p {}, (tr "~DROPZONE.SQUARES_LOOK_BEST"))
    )
