# Purpose of this class: Provide an abstraction over our chosen diagramming toolkit.

module.exports = class DiagramToolkit

  constructor: (@domContext, @options = {}) ->
    @type      = 'jsPlumbWrappingDiagramToolkit'
    @color     = @options.color or '#233'
    @lineWidth = @options.lineWidth or 6
    @kit       = jsPlumb.getInstance {Container: @domContext}
    @kit.importDefaults
      Connector:        ['Bezier', {curviness: 50}],
      Anchors:          ['TopCenter', 'BottomCenter'],
      Endpoint:         @_endpointOptions,
      DragOptions :     {cursor: 'pointer', zIndex:2000},
      DoNotThrowErrors: false
    @registerListeners()

  registerListeners: ->
    @kit.bind 'connection', @handleConnect.bind @

  handleConnect: (info, evnt)  ->
    @options.handleConnect? info, evnt
    true

  handleClick: (connection, evnt) ->
    @options.handleClick? connection, evnt

  handleLabelClick: (label, evnt) ->
    @options.handleClick? label.component, evnt

  handleDisconnect: (info, evnt) ->
    return (@options.handleDisconnect? info, evnt) or true

  repaint: ->
    @kit.repaintEverything()

  _endpointOptions: [ "Dot", { radius:15 } ]

  makeTarget: (div) ->
    opts = (anchor) =>
      isTarget: true
      isSource: true
      endpoint: @_endpointOptions
      connector: ['Bezier']
      anchor: anchor
      paintStyle: @_paintStyle()
      maxConnections: -1
    @kit.addEndpoint div, (opts 'Top')
    @kit.addEndpoint div, (opts 'Bottom')

  clear: ->
    if @kit
      @kit.deleteEveryEndpoint()
      @kit.reset()
      @registerListeners()
    else
      console.log 'No kit defined'

  _paintStyle: (color) ->
    strokeStyle: color or @color,
    lineWidth: @lineWidth

  _overlays: (label, selected) ->
    results = [['Arrow', {
      location: 1.0,
      events: { click: @handleLabelClick.bind @ }
    }]]
    if label?.length > 0
      results.push ['Label', {
        location: 0.4,
        events: { click: @handleLabelClick.bind @ },
        label: label or '',
        cssClass: "label#{if selected then ' selected' else ''}"
      }]
    results

  _clean_borked_endpoints: ->
    $('._jsPlumb_endpoint:not(.jsplumb-draggable)').remove()

  addLink: (source, target, label, color, source_terminal, target_terminal, linkModel) ->
    paintStyle = @_paintStyle color
    if linkModel.selected
      paintStyle.lineWidth = paintStyle.lineWidth * 1.2

    connection = @kit.connect
      source: source
      target: target
      anchors: [source_terminal or "Top", target_terminal or "Bottom"]
      paintStyle: paintStyle
      overlays: @_overlays label, linkModel.selected
    connection.bind 'click', @handleClick.bind @
    connection.linkModel = linkModel

  setSuspendDrawing: (shouldwestop) ->
    if not shouldwestop
      @_clean_borked_endpoints()
    @kit.setSuspendDrawing shouldwestop, not shouldwestop

  supspendDrawing: ->
    @setSuspendDrawing true

  resumeDrawing: ->
    @setSuspendDrawing false


