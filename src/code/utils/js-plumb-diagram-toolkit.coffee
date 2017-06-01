# Purpose of this class: Provide an abstraction over our chosen diagramming toolkit.
LinkColors = require "../utils/link-colors"

module.exports = class DiagramToolkit

  constructor: (@domContext, @options = {}) ->
    @type      = "jsPlumbWrappingDiagramToolkit"
    @color     = @options.color or LinkColors.defaultLight
    @lineWidth = @options.lineWidth or 1
    @lineWidth = 1
    @lineWidthVariation = 4
    @kit       = jsPlumb.getInstance {Container: @domContext}
    @kit.importDefaults
      Connector:        ["Bezier", {curviness: 80}],
      Anchor:           ["Continuous", { faces:["top","left","right"] }]
      DragOptions :     {cursor: 'pointer', zIndex:2000},
      ConnectionsDetachable: true,
      DoNotThrowErrors: false
    @registerListeners()

    # transfer-modifier links attach to fixed locations on the left or right of the flow node
    @flowNodeModifierAnchors = [[0, 0.4, -1, 0, 8, 0], [1, 0.7, 1, 0, -8, 0]]
    # flow links attach to fixed locations on the left or right of the flow node
    @flowNodeFlowAnchors = [[0, 0.6, -1, 0, 16, 0], [1, 0.6, 1, 0, -16, 0]]
    # other links attach to three fixed locations on the top or bottom of the flow node or
    # two fixed locations on the left or right of the flow node chosen to not overlap the others
    @flowNodeLinkAnchors = [[0.3, 0, 0, -1, 0, 12], [0.5, 0, 0, -1, 0, 12], [0.7, 0, 0, -1, 0, 12],
                            [0, 0.25, -1, 0, 8, 0], [0, 0.75, -1, 0, 8, 0],
                            [0.3, 1, 0, 1, 0, -10], [0.5, 1, 0, 1, 0, -10], [0.7, 1, 0, 1, 0, -10],
                            [1, 0.25, 1, 0, -8, 0], [1, 0.4, 1, 0, -8, 0], [1, 0.8, 1, 0, -8, 0]]
    # links to non-flow nodes link to locations assigned by jsPlumb on the left, top, or right faces
    @standardAnchors = ["Continuous", { faces:["top","left","right"] }]

  registerListeners: ->
    @kit.bind 'connection', @handleConnect.bind @
    @kit.bind 'beforeDrag', (source) =>
      @$currentSource = $(source.source)
      @$currentSource.addClass("show-drag")
      true
    @kit.bind ['connectionAborted', 'beforeDrop'], (args) =>
      @$currentSource.removeClass("show-drag")
      true

  handleConnect: (info, evnt)  ->
    @options.handleConnect? info, evnt
    true

  handleClick: (connection, evnt) ->
    @options.handleClick? connection, evnt

  handleDoubleClick: (connection, evnt) ->
    @options.handleDoubleClick? connection, evnt

  handleLabelClick: (label, evnt) ->
    @options.handleDoubleClick? label.component, evnt

  handleDisconnect: (info, evnt) ->
    return (@options.handleDisconnect? info, evnt) or true

  repaint: ->
    @kit.repaintEverything()

  _endpointOptions: (style, size, cssClass) ->
    results = [ style,
      width: size
      height: size
      cssClass: cssClass
    ]
    results

  makeSource: (div, clientClasses) ->
    classes = 'node-link-button' + if clientClasses then " #{clientClasses}" else ''
    endpoints = @kit.addEndpoint(div,
      isSource: true
      dropOptions:
        activeClass: "dragActive"
      anchor: "Bottom"
      connectorStyle : { strokeStyle:"#666" }
      endpoint: @_endpointOptions("Rectangle", 26, classes)
      connectorOverlays: [["Arrow", {location:1.0, width:10, length:10}]]
      maxConnections: -1
    )

    addHoverState = (endpoint) ->
      endpoint.bind "mouseover", ->
        $(endpoint.element).parent().addClass("show-hover")
      endpoint.bind "mouseout", ->
        $(endpoint.element).parent().removeClass("show-hover")

    if endpoints?.element
      addHoverState endpoints
    else if endpoints?.length
      _.forEach endpoints, addHoverState

  makeTarget: (div, style) ->
    size = 55
    @kit.addEndpoint(div,
      isTarget: true
      isSource: false
      anchor: "Center"
      endpoint: @_endpointOptions("Rectangle", size, style )
      paintStyle: { fillStyle: "transparent"}
      maxConnections: -1
      dropOptions:
        activeClass: "dragActive"
        hoverClass: "droppable"
    )

  clear: ->
    if @kit
      @kit.deleteEveryEndpoint()
      @kit.reset()
      @registerListeners()
    else
      log.info "No kit defined"

  _paintStyle: (color) ->
    strokeStyle: color or @color,
    lineWidth: @lineWidth
    outlineColor: "rgb(0,240,10)"
    outlineWidth: "10px"

  _overlays: (label, selected, editingLabel=true, thickness, finalColor, variableWidth, arrowFoldback, changeIndicator, link, hideArrow) ->
    results = []
    if not hideArrow
      results.push ["Arrow", {
        location: 1.0
        length: 10
        variableWidth: variableWidth
        width: 9 + thickness
        foldback: arrowFoldback
      }]
    if changeIndicator && variableWidth != 0
      results.push ["Label", {
        location: 0.1,
        label: changeIndicator or '',
        cssClass: "link-indicator#{if changeIndicator == '+' then ' increase' else ' decrease'}"
      }]
    else if changeIndicator
      results.push ["Label", {
        location: 0.9,
        label: changeIndicator or '',
        cssClass: "link-indicator#{if changeIndicator == '+' then ' increase' else ' decrease'}"
      }]
    if editingLabel
      results.push  ["Custom", {
        create: @_createEditLabel(link, label)
        location: 0.5
        id:"customOverlay"
      }]
    else if label?.length > 0
      results.push ["Label", {
        location: 0.5,
        events: { click: @handleLabelClick.bind @ },
        label: label or '',
        cssClass: "label#{if selected then ' selected' else ''}"
      }]
    results

  _gradient: (startColor, endColor, offset) ->
    result = stops: [[0.0,startColor], [1.0,endColor]]
    result

  _createEditLabel: (link, label) ->
    width =
      if label.length < 13 then 90
      else if label.length < 19 then 130
      else 200
    style = {width: width}
    return =>
      _self = this
      $("<input>").val(label).css(style)
      .show ->
        $(@).focus()
      .change ->
        _self.options.handleLabelEdit? link, this.value


  _clean_borked_endpoints: ->
    $('._jsPlumb_endpoint:not(.jsplumb-draggable)').remove()


  addLink: (opts) ->
    paintStyle = @_paintStyle LinkColors.default
    paintStyle.outlineColor = "none"
    paintStyle.outlineWidth = 4

    startColor = LinkColors.default
    finalColor = LinkColors.default
    fixedColor = LinkColors.default
    fadedColor = LinkColors.defaultFaded
    changeIndicator = ''

    thickness = Math.abs(opts.magnitude)
    if (!thickness)
      thickness = 1

    if opts.isDashed
      paintStyle.dashstyle = "4 2"
      fixedColor = fixedColor = LinkColors.dashed
    if opts.isSelected
      paintStyle.outlineColor = LinkColors.selectedOutline
    if opts.isSelected and opts.isDashed
      paintStyle.dashstyle = undefined
    if opts.magnitude < 0
      fixedColor = LinkColors.decrease
      fadedColor = LinkColors.decreaseFaded
      changeIndicator = '\u2013'
    if opts.magnitude > 0
      fixedColor = LinkColors.increase
      fadedColor = LinkColors.increaseFaded
      changeIndicator = '+'
    if opts.color != LinkColors.default
      fixedColor = opts.color
      thickness = 2
    if opts.thickness
      thickness = opts.thickness

    paintStyle.lineWidth = thickness
    startColor = finalColor

    if (opts.useGradient)
      startColor = finalColor = fixedColor
      if opts.gradual < 0
        finalColor = fadedColor
      if opts.gradual > 0
        startColor = fadedColor
      paintStyle.gradient = @_gradient startColor, finalColor

    paintStyle.strokeStyle = fixedColor
    paintStyle.vertical = true

    variableWidthMagnitude = 0
    arrowFoldback = 0.6

    if (opts.gradual && opts.useVariableThickness)
      variableWidthMagnitude = @lineWidthVariation * opts.gradual
      arrowFoldback = 0.8
      @kit.importDefaults
        Connector: ["Bezier", {curviness: 120, variableWidth: variableWidthMagnitude}]
      if (opts.gradual > 0)
        thickness = thickness * @lineWidthVariation

    if opts.showIndicators? and not opts.showIndicators
      changeIndicator = null

    if opts.isTransfer
      @kit.importDefaults
        Connector: ["Flowchart", {}]

    linkSource = opts.linkModel?.sourceNode
    linkTarget = opts.linkModel?.targetNode
    linkRelation = opts.linkModel?.relation

    isLinkToFlowNode = linkTarget?.isTransfer
    isModifierToFlowNode = linkRelation?.isTransferModifier or
                            # transfer-modifier link isn't identified as such until it's defined
                            linkTarget?.isTransfer and linkTarget.transferLink?.sourceNode is linkSource
    isTransferToFlowNode = opts.isTransfer and opts.fromSource
    isTransferFromFlowNode = opts.isTransfer and not opts.fromSource
    sourceAnchors = if isTransferFromFlowNode then @flowNodeFlowAnchors else @standardAnchors
    targetAnchors = if isTransferToFlowNode then @flowNodeFlowAnchors else \
                      if isModifierToFlowNode then @flowNodeModifierAnchors else \
                        if isLinkToFlowNode then @flowNodeLinkAnchors else @standardAnchors

    connection = @kit.connect
      source: opts.source
      target: opts.target
      anchors: [sourceAnchors, targetAnchors]
      paintStyle: paintStyle
      overlays: @_overlays opts.label, opts.isSelected, opts.isEditing, thickness, fixedColor, variableWidthMagnitude, arrowFoldback, changeIndicator, opts.linkModel, opts.hideArrow
      endpoint: @_endpointOptions("Rectangle", thickness, 'node-link-endpoint')

    connection.bind 'click', @handleClick.bind @
    connection.bind 'dblclick', @handleDoubleClick.bind @
    connection.linkModel = opts.linkModel
    opts.linkModel.jsPlumbConnection = connection

    @kit.importDefaults
      Connector: ["Bezier", {curviness: 60, variableWidth: null}]

  setSuspendDrawing: (shouldwestop) ->
    if not shouldwestop
      @_clean_borked_endpoints()
    @kit.setSuspendDrawing shouldwestop, not shouldwestop

  suspendDrawing: ->
    @setSuspendDrawing true

  resumeDrawing: ->
    @setSuspendDrawing false
