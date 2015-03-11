var $ = require('./vendor/touchpunch');
// Purpose of this class: Provide an abstraction over our
// chosen diagramming toolkit.  
function DiagramToolkit(domContext, options) {
  this.options = options || {};
  this.domContex = domContext;
  this.type      = 'jsPlumbWrappingDiagramToolkit';
  this.color     = this.options.color || "#233" ;
  this.lineWidth = this.options.lineWidth || 6;    
  this.kit       = jsPlumb.getInstance({ Container: domContext});

  this.registerListeners = function() {
    this.kit.bind("connection", this.handleConnect.bind(this));
  };

  this.handleConnect = function(info,evnt) {
    if (this.options.handleConnect) {
      this.options.handleConnect(info, evnt);
    }
    return true;
  };

  this.handleClick = function(connection, evnt) {
    if (this.options.handleClick) {
      this.options.handleClick(connection,evnt);
    }
  },
  this.handleLabelClick = function(label, evnt) {
    // TODO:  how can we do this?
    // this.options.handleClick(label.component,evnt);
  },
  this.handleDisconnect = function(info,evnt) {
    if (this.options.handleDisconnect) {
      return this.options.handleDisconnect(info, evnt);
    }
    return true;
  };

  this.repaint = function() {
    this.kit.repaintEverything();
  };

  this._endpointOptions = [ "Dot", { radius:15 } ];

  this.makeTarget = function(div) {
    var opts = {
      isTarget:true, 
      isSource:true,
      endpoint: this._endpointOptions,
      connector:[ "Bezier"],
      anchor: "Top",
      paintStyle: this._paintStyle(),
      maxConnections: -1,
    };
    
    this.kit.addEndpoint(div,opts);
    opts.anchor = "Bottom";
    this.kit.addEndpoint(div,opts);
  };

  this.clear = function() {
    if(this.kit) {
      this.kit.deleteEveryEndpoint();
      this.kit.reset();
      this.registerListeners();
    }
    else {
      console.log("No kit defined");
    }
  };

  this.kit.importDefaults({
    Connector:        [ "Bezier",    { curviness: 50 } ],
    Anchors:          [ "TopCenter", "BottomCenter"],
    Endpoint:         this._endpointOptions,
    DragOptions :     { cursor: 'pointer', zIndex:2000 },
    DoNotThrowErrors: false
  });

  this._paintStyle = function(color) {
    var _color = color || this.color;
    var _line_width = this.lineWidth;
    return ({
      strokeStyle: _color,
      lineWidth: _line_width
    });
  };
    
  this._overlays = function(label, selected) {
    var _label = label || "";
    var hasLabel = label.length > 0;
    var cssClass = "label";
    if (selected) {
      cssClass = cssClass + " selected";
    }
    var results = [[ "Arrow", { 
      location: 1.0,
      events: { click: this.handleLabelClick }
    }]];
    if (hasLabel) {
      results.push(["Label", { 
        location: 0.4, 
        events: { click: this.handleLabelClick },
        label:_label, 
        cssClass: cssClass}]);
    }
    return results;
  };

  this._clean_borked_endpoints = function() {
    // $("._jsPlumb_endpoint:not(.jsplumb-draggable)").remove();
  };

  this.addLink = function(source, target, label, color, source_terminal, target_terminal, linkModel) {
    var paintStyle = this._paintStyle(color);
    var selected = linkModel.selected;
    if(selected) {
      paintStyle.lineWidth = paintStyle.lineWidth * 1.2;
    }
    var connection = this.kit.connect({
      source: source,
      target: target,
      anchors: [source_terminal || "Top", target_terminal || "Bottom"],
      paintStyle: paintStyle,
      overlays: this._overlays(label,selected)
    });
    connection.bind("click", this.handleClick.bind(this));
    connection.linkModel = linkModel;
  };

  this.setSuspendDrawing = function(shouldwestop) {
    if (!shouldwestop) {
      this._clean_borked_endpoints();
    }
    this.kit.setSuspendDrawing(shouldwestop,!shouldwestop);
  };

  this.supspendDrawing = function() {
    this.setSuspendDrawing(true);
  };
  
  this.resumeDrawing = function() {
    this.setSuspendDrawing(false);
  };

  this.registerListeners();

}


module.exports = DiagramToolkit;