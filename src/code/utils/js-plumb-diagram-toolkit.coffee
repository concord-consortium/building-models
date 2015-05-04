# Purpose of this class: Provide an abstraction over our chosen diagramming toolkit.

module.exports = class DiagramToolkit

  constructor: (@domContext, @options = {}) ->
    @type      = "jsPlumbWrappingDiagramToolkit"
    @color     = @options.color or '#233'
    @lineWidth = @options.lineWidth or 1
    @lineWidth = 1
    @kit       = jsPlumb.getInstance {Container: @domContext}
    @kit.importDefaults
      Connector:        ["Bezier", {curviness: 60}],
      Anchor:           "Continuous",
      DragOptions :     {cursor: 'pointer', zIndex:2000},
      ConnectionsDetachable: true,
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

  makeSource: (div) ->
    @kit.addEndpoint(div,
      isSource: true
      connector: ["Bezier"]
      dropOptions:
        activeClass: "dragActive"
      anchor: "Center"
      #paintStyle: @_paintStyle()
      endpoint: ["Rectangle",
        width: 19
        height: 19
        cssClass: 'node-link-button'
      ]
      maxConnections: -1
    )

  makeTarget: (div) ->
    anchors = [
      "TopLeft", "Top","TopRight",
      "Right", "Left",
      "BottomLeft","Bottom", "BottomRight"]
    for anchor in anchors
      @kit.addEndpoint(div,
        isTarget: true
        connector: ["Bezier"]
        anchor: anchor
        endpoint: ["Rectangle",
          radius: 25
          height: 25
          cssClass: "node-link-target"
        ]
        maxConnections: -1
        dropOptions:
          activeClass: "dragActive"
     )

  clear: ->
    if @kit
      @kit.deleteEveryEndpoint()
      @kit.reset()
      @registerListeners()
    else
      console.log "No kit defined"

  _paintStyle: (color) ->
    strokeStyle: color or @color,
    lineWidth: @lineWidth
    outlineColor: "rgb(0,240,10)"
    outlineWidth: "10px"

  _overlays: (label, selected) ->
    results = [["Arrow", {
      location: 1.0
      length: 10
      width: 10
      events: { click: @handleLabelClick.bind @ }
    }]]
    if label?.length > 0
      results.push ["Label", {
        location: 0.5,
        events: { click: @handleLabelClick.bind @ },
        label: label or '',
        cssClass: "label#{if selected then ' selected' else ''}"
      }]
    results

  _clean_borked_endpoints: ->
    $('._jsPlumb_endpoint:not(.jsplumb-draggable)').remove()

  addLink: (source, target, label, color, source_terminal, target_terminal, linkModel) ->
    paintStyle = @_paintStyle color
    paintStyle.outlineColor = "none"
    paintStyle.outlineWidth = 20
    if linkModel.selected
      paintStyle.outlineColor = "#f6bf33"
      paintStyle.outlineWidth = 1

    connection = @kit.connect
      source: source
      target: target
      paintStyle: paintStyle
      overlays: @_overlays label, linkModel.selected
      endpoint: ["Rectangle",
        width: 10
        height: 10
        cssClass: 'node-link-target'
      ]

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


