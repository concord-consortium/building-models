# Purpose of this class: Provide an abstraction over our chosen diagramming toolkit.

module.exports = class DiagramToolkit

  constructor: (@domContext, @options = {}) ->
    @type      = "jsPlumbWrappingDiagramToolkit"
    @defaultLinkColor         = '#777'
    @defaultFadedLinkColor    = "rgba(120,120,120,0)"
    @linkIncreaseColor        = "rgba(230,40,20,1)"
    @linkDecreaseColor        = "rgba(0,110,200,1)"
    @linkIncreaseFadedColor   = "rgba(230,40,20,0.2)"
    @linkDecreaseFadedColor   = "rgba(0,110,200,0.2)"
    @linkDashedColor          = "#aaa"
    @linkSelectedOutlineColor = "#f6bf33"
    @color     = @options.color or '#233'
    @lineWidth = @options.lineWidth or 1
    @lineWidth = 1
    @lineWidthVariation = 6
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

  makeSource: (div) ->
    endpoints = @kit.addEndpoint(div,
      isSource: true
      dropOptions:
        activeClass: "dragActive"
      anchor: "Center"
      endpoint: @_endpointOptions("Rectangle", 19, 'node-link-button')
      maxConnections: -1
    )

    addHoverState = (endpoint) ->
      endpoint.bind "mouseover", ->
        $(endpoint.element).addClass("show-hover")
      endpoint.bind "mouseout", ->
        $(endpoint.element).removeClass("show-hover")

    if endpoints?.element
      addHoverState endpoints
    else if endpoints?.length
      _.forEach endpoints, addHoverState

  makeTarget: (div) ->
    size = 60
    @kit.addEndpoint(div,
      isTarget: true
      isSource: false
      anchor: "Center"
      endpoint: @_endpointOptions("Rectangle", size, 'node-link-target')
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
      log.info "No kit defined"

  _paintStyle: (color) ->
    strokeStyle: color or @color,
    lineWidth: @lineWidth
    outlineColor: "rgb(0,240,10)"
    outlineWidth: "10px"

  _overlays: (label, selected, editingLabel=true, thickness, finalColor, variableWidth) ->
    results = [["Arrow", {
      location: 1.0
      length: 10
      variableWidth: variableWidth
      width: 9 + thickness
    }]]
    if editingLabel
      results.push  ["Custom", {
        create: @_createEditLabel(label)
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

  _createEditLabel: (label) ->
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
        _self.options.handleLabelEdit? this.value


  _clean_borked_endpoints: ->
    $('._jsPlumb_endpoint:not(.jsplumb-draggable)').remove()

  addLink: (source, target, label, color, magnitude, isDashed, isSelected, isEditing, gradual, useGradient, useVariableThickness, linkModel) ->
    paintStyle = @_paintStyle @defaultLinkColor
    paintStyle.outlineColor = "none"
    paintStyle.outlineWidth = 1
    
    startColor = @defaultLinkColor
    finalColor = @defaultLinkColor
    fixedColor = @defaultLinkColor
    fadedColor = @defaultFadedLinkColor
    
    thickness = Math.abs(magnitude)
    if (!thickness)
      thickness = 1
    
    if isDashed
      paintStyle.dashstyle = "4 2"
      fixedColor = fixedColor = @linkDashedColor
    if isSelected
      paintStyle.outlineColor = @linkSelectedOutlineColor
      paintStyle.outlineWidth = 1
    if magnitude < 0
      fixedColor = @linkDecreaseColor
      fadedColor = @linkDecreaseFadedColor
    if magnitude > 0
      fixedColor = @linkIncreaseColor
      fadedColor = @linkIncreaseFadedColor
    if color != @defaultLinkColor
      fixedColor = color

    paintStyle.lineWidth = thickness
    startColor = finalColor
    
    if (useGradient)
      startColor = finalColor = fixedColor
      if gradual < 0
        finalColor = fadedColor
      if gradual > 0
        startColor = fadedColor
      paintStyle.gradient = @_gradient startColor, finalColor
      
    paintStyle.strokeStyle = fixedColor
    paintStyle.vertical = true
    
    if (gradual && useVariableThickness)
      @kit.importDefaults
        Connector: ["Bezier", {curviness: 60, variableWidth: @lineWidthVariation * gradual}]
      if (gradual > 0)
        thickness = thickness * @lineWidthVariation

    connection = @kit.connect
      source: source
      target: target
      paintStyle: paintStyle
      overlays: @_overlays label, isSelected, isEditing, thickness, fixedColor, (useVariableThickness && gradual)
      endpoint: @_endpointOptions("Rectangle", thickness, 'node-link-endpoint')

    connection.bind 'click', @handleClick.bind @
    connection.bind 'dblclick', @handleDoubleClick.bind @
    connection.linkModel = linkModel
    
    @kit.importDefaults
      Connector: ["Bezier", {curviness: 60, variableWidth: null}]

  setSuspendDrawing: (shouldwestop) ->
    if not shouldwestop
      @_clean_borked_endpoints()
    @kit.setSuspendDrawing shouldwestop, not shouldwestop

  supspendDrawing: ->
    @setSuspendDrawing true

  resumeDrawing: ->
    @setSuspendDrawing false
