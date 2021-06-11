/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Purpose of this class: Provide an abstraction over our chosen diagramming toolkit.

const _ = require("lodash");
const log = require("loglevel");

import { LinkColors } from "../utils/link-colors";
import * as $ from "jquery";

import { getViewScale, registerScaleListener } from "../utils/scale-app";

// const jsPlumb = require("../../vendor/jsPlumb");
declare var jsPlumb;

export class DiagramToolkit {
  private domContext: any;
  private options: any;
  private type: string;
  private color: string;
  private lineWidth: number;
  private lineWidthVariation: number;
  private kit: any;
  private flowNodeModifierAnchors: any[];
  private flowNodeFlowAnchors: any[];
  private flowNodeLinkAnchors: any[];
  private standardAnchors: any[];
  private $currentSource: any;

  constructor(domContext, options) {
    this.domContext = domContext;
    if (options == null) { options = {}; }
    this.options = options;
    this.type      = "jsPlumbWrappingDiagramToolkit";
    this.color     = this.options.color || LinkColors.defaultLight;
    this.lineWidth = this.options.lineWidth || 1;
    this.lineWidth = 1;
    this.lineWidthVariation = 4;
    this.kit       = jsPlumb.getInstance({Container: this.domContext});
    this.kit.importDefaults({
      Connector:        ["Bezier", {curviness: 80}],
      Anchor:           ["Continuous", { faces: ["top", "left", "right"] }],
      DragOptions :     {cursor: "pointer", zIndex: 2000},
      ConnectionsDetachable: true,
      DoNotThrowErrors: false
    });

    this.kit.setZoom(getViewScale(), true);
    registerScaleListener((scale: number) => {
      this.kit.setZoom(scale, true);
    });

    this.kit.repaintEverything();
    this.registerListeners();

    // transfer-modifier links attach to fixed locations on the left or right of the flow node
    this.flowNodeModifierAnchors = [[0, 0.4, -1, 0, 8, 0], [1, 0.7, 1, 0, -8, 0]];
    // flow links attach to fixed locations on the left or right of the flow node
    this.flowNodeFlowAnchors = [[0.1, 0.6, -1, 0, 16, 0], [1, 0.6, 1, 0, -16, 0]];
    // other links attach to three fixed locations on the top or bottom of the flow node or
    // two fixed locations on the left or right of the flow node chosen to not overlap the others
    this.flowNodeLinkAnchors = [[0.3, 0, 0, -1, 0, 12], [0.5, 0, 0, -1, 0, 12], [0.7, 0, 0, -1, 0, 12], // top
      [0, 0.25, -1, 0, 8, 0], [0, 0.75, -1, 0, 8, 0],                         // left
      [0.3, 1, 0, 1, 0, 0], [0.5, 1, 0, 1, 0, 0], [0.7, 1, 0, 1, 0, 0],       // bottom
      [1, 0.25, 1, 0, -8, 0], [1, 0.4, 1, 0, -8, 0], [1, 0.8, 1, 0, -8, 0]];   // right
    // links to non-flow nodes link to locations assigned by jsPlumb on the left, top, or right faces
    this.standardAnchors = ["Continuous", { faces: ["top", "left", "right"] }];
  }

  public registerListeners() {
    this.kit.bind("connection", this.handleConnect.bind(this));
    this.kit.bind("beforeDrag", source => {
      this.$currentSource = $(source.source);
      this.$currentSource.addClass("show-drag");
      return true;
    });
    return this.kit.bind(["connectionAborted", "beforeDrop"], args => {
      this.$currentSource.removeClass("show-drag");
      return true;
    });
  }

  public handleConnect(info, evnt)  {
    if (typeof this.options.handleConnect === "function") {
      this.options.handleConnect(info, evnt);
    }
    return true;
  }

  public handleClick(connection, evnt) {
    return (typeof this.options.handleClick === "function" ? this.options.handleClick(connection, evnt) : undefined);
  }

  public handleDoubleClick(connection, evnt) {
    return (typeof this.options.handleDoubleClick === "function" ? this.options.handleDoubleClick(connection, evnt) : undefined);
  }

  public handleLabelClick(label, evnt) {
    return (typeof this.options.handleLabelClick === "function" ? this.options.handleLabelClick(label, evnt) : undefined);
  }

  public handleDisconnect(info, evnt) {
    return (typeof this.options.handleDisconnect === "function" ? this.options.handleDisconnect(info, evnt) : undefined) || true;
  }

  public repaint() {
    return this.kit.repaintEverything();
  }

  public _endpointOptions(style, size, cssClass) {
    const results = [ style, {
      width: size,
      height: size,
      cssClass
    }
    ];
    return results;
  }

  public makeSource(div, clientClasses) {
    const classes = `node-link-button${clientClasses ? ` ${clientClasses}` : ""}`;
    const endpoints = this.kit.addEndpoint(div, {
      isSource: true,
      dropOptions: {
        activeClass: "dragActive"
      },
      anchor: "Bottom",
      connectorStyle : { strokeStyle: "#666" },
      endpoint: this._endpointOptions("Rectangle", 26, classes),
      connectorOverlays: [["Arrow", {location: 1.0, width: 10, length: 10}]],
      maxConnections: -1
    }
    );

    const addHoverState = (endpoint) => {
      endpoint.bind("mouseover", () => $(endpoint.element).parent().addClass("show-hover"));
      return endpoint.bind("mouseout", () => $(endpoint.element).parent().removeClass("show-hover"));
    };

    if (endpoints != null ? endpoints.element : undefined) {
      return addHoverState(endpoints);
    } else if (endpoints != null ? endpoints.length : undefined) {
      return _.forEach(endpoints, addHoverState);
    }
  }

  public makeTarget(div, style) {
    const size = 55;
    return this.kit.addEndpoint(div, {
      isTarget: true,
      isSource: false,
      anchor: "Center",
      endpoint: this._endpointOptions("Rectangle", size, style ),
      paintStyle: { fillStyle: "transparent"},
      maxConnections: -1,
      dropOptions: {
        activeClass: "dragActive",
        hoverClass: "droppable"
      }
    }
    );
  }

  public clear() {
    if (this.kit) {
      this.kit.deleteEveryEndpoint();
      this.kit.reset();
      this.kit.repaintEverything();
      return this.registerListeners();
    } else {
      return log.info("No kit defined");
    }
  }

  public _paintStyle(color): any {
    return {
      strokeStyle: color || this.color,
      lineWidth: this.lineWidth,
      outlineColor: "rgb(0,240,10)",
      outlineWidth: "10px"
    };
  }

  public _overlays({label, selected, editingLabel, thickness, finalColor, variableWidth, arrowFoldback, changeIndicator, link, hideArrow, transferNotch}:
                   {label, selected, editingLabel, thickness, finalColor, variableWidth, arrowFoldback, changeIndicator, link, hideArrow, transferNotch}) {
    if (editingLabel == null) { editingLabel = true; }
    const results: any[] = []; // checked: any ok
    if (!hideArrow) {
      results.push(["Arrow", {
        location: 1.0,
        length: 10,
        variableWidth,
        width: 9 + thickness,
        foldback: arrowFoldback
      }]);
    }
    if (transferNotch) {
      results.push(["Custom", {
        create: this._createTransferArrowNotch(transferNotch),
        location: 0,
        id: "transferNotch"
      }]);
    }
    if (changeIndicator && (variableWidth !== 0)) {
      results.push(["Label", {
        location: 0.1,
        label: changeIndicator || "",
        cssClass: `link-indicator${changeIndicator === "+" ? " increase" : " decrease"}`
      }]);
    } else if (changeIndicator) {
      results.push(["Label", {
        location: 0.9,
        label: changeIndicator || "",
        cssClass: `link-indicator${changeIndicator === "+" ? " increase" : " decrease"}`
      }]);
    }
    if (editingLabel) {
      results.push(["Custom", {
        create: this._createEditLabel(link, label),
        location: 0.5,
        id: "customOverlay"
      }]);
    } else if ((label != null ? label.length : undefined) > 0) {
      results.push(["Label", {
        location: 0.5,
        events: { click: this.handleLabelClick.bind(this) },
        label: label || "",
        cssClass: `label${selected ? " selected" : ""}`
      }]);
    }
    return results;
  }

  public _gradient(startColor, endColor) {
    const result = {stops: [[0.0, startColor], [1.0, endColor]]};
    return result;
  }

  public _createEditLabel(link, label) {
    const width =
      label.length < 13 ? 90
        : label.length < 19 ? 130
          : 200;
    const style = {width};

    const _self = this;
    return () => {
      const input = $("<input>").val(label).css(style);
      input
        .show(() => {
          // wait for input to show on next render before focus
          setTimeout(() => {
            input.focus();
          }, 1);
        })
        .change(() => {
          if (typeof _self.options.handleLabelEdit === "function") {
            _self.options.handleLabelEdit(link, input.val());
          }
        });
      return input;
    };
  }

  public _createTransferArrowNotch(transferNotch) {
    return () => {
      const svg = $('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 24 24" fill="#ececec">')  // ececec
        .html('<path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />');
      return $("<div />")
        .css({width: 32, height: 32})
        .append(svg);
    };
  }

  public _clean_borked_endpoints() {
    return $("._jsPlumb_endpoint:not(.jsplumb-draggable)").remove();
  }


  public addLink(opts) {
    const paintStyle = this._paintStyle(LinkColors.default);
    paintStyle.outlineColor = "none";
    // use large outline width for all links, this gives a larger selection target around the link
    paintStyle.outlineWidth = 10;

    const formula = opts.linkModel != null && opts.linkModel.relation != null ? opts.linkModel.relation.formula : undefined;
    const isAddedToOrSubtractedFrom = formula === "+in" || formula === "-in";

    let startColor = LinkColors.default;
    let finalColor = LinkColors.default;
    let fixedColor = LinkColors.default;
    let fadedColor = LinkColors.defaultFaded;
    let changeIndicator: string|null = "";

    let thickness = Math.abs(opts.magnitude);
    if (!thickness) {
      thickness = 1;
    }

    if (opts.isDashed) {
      paintStyle.dashstyle = "4 2";
      fixedColor = (fixedColor = LinkColors.dashed);
    }
    if (opts.isSelected) {
      paintStyle.outlineColor = LinkColors.selectedOutline;
      // reduce the outline width of the selected link since it is rendered
      paintStyle.outlineWidth = 4;
    }
    if (opts.isSelected && opts.isDashed) {
      paintStyle.dashstyle = undefined;
    }
    if (opts.magnitude < 0) {
      changeIndicator = "\u2013";
    }
    if (opts.magnitude > 0) {
      changeIndicator = "+";
    }
    if (opts.color !== LinkColors.default) {
      fixedColor = opts.color;
      thickness = 2;
    }
    if (opts.thickness) {
      ({ thickness } = opts);
    }

    if (opts.isTransfer || isAddedToOrSubtractedFrom) {
      thickness = 10;
      fixedColor = LinkColors.transferPipe;
      fadedColor = LinkColors.transferPipe;
      this.kit.importDefaults({
        Connector: ["Flowchart", {}]});
    }

    paintStyle.lineWidth = thickness;
    startColor = finalColor;

    if (opts.useGradient) {
      startColor = (finalColor = fixedColor);
      if (opts.gradual < 0) {
        finalColor = fadedColor;
      }
      if (opts.gradual > 0) {
        startColor = fadedColor;
      }
      paintStyle.gradient = this._gradient(startColor, finalColor);
    }

    paintStyle.strokeStyle = fixedColor;
    paintStyle.vertical = true;

    let variableWidthMagnitude = 0;
    let arrowFoldback = 0.6;

    if (opts.gradual && opts.useVariableThickness) {
      variableWidthMagnitude = this.lineWidthVariation * opts.gradual;
      arrowFoldback = 0.8;
      this.kit.importDefaults({
        Connector: ["Bezier", {curviness: 120, variableWidth: variableWidthMagnitude}]});
      if (opts.gradual > 0) {
        thickness = thickness * this.lineWidthVariation;
      }
    }

    if ((opts.showIndicators != null) && !opts.showIndicators) {
      changeIndicator = null;
    }

    const linkSource = opts.linkModel != null ? opts.linkModel.sourceNode : undefined;
    const linkTarget = opts.linkModel != null ? opts.linkModel.targetNode : undefined;
    const linkRelation = opts.linkModel != null ? opts.linkModel.relation : undefined;

    const isLinkToFlowNode = linkTarget != null ? linkTarget.isTransfer : undefined;
    const isModifierToFlowNode = (linkRelation != null ? linkRelation.isTransferModifier : undefined) ||
                            // transfer-modifier link isn't identified as such until it's defined
                            ((linkTarget != null ? linkTarget.isTransfer : undefined) && ((linkTarget.transferLink != null ? linkTarget.transferLink.sourceNode : undefined) === linkSource));
    const isTransferToFlowNode = opts.isTransfer && opts.fromSource;
    const isTransferFromFlowNode = opts.isTransfer && !opts.fromSource;
    const sourceAnchors = isTransferFromFlowNode ? this.flowNodeFlowAnchors : this.standardAnchors;
    const targetAnchors = isTransferToFlowNode ? this.flowNodeFlowAnchors :
      isModifierToFlowNode ? this.flowNodeModifierAnchors :
        isLinkToFlowNode ? this.flowNodeLinkAnchors : this.standardAnchors;

    // swap source and target for subtracts from, otherwise the arrow doesn't render correctly
    // (if you change the location to 0 the thick arrow bleeds out in front of the arrow)
    const swapEnds = formula === "-in";

    const connection = this.kit.connect({
      source: swapEnds ? opts.target : opts.source,
      target: swapEnds ? opts.source : opts.target,
      anchors: swapEnds ? [targetAnchors, sourceAnchors] : [sourceAnchors, targetAnchors],
      paintStyle,
      overlays: this._overlays({
        label: opts.label,
        selected: opts.isSelected,
        editingLabel: opts.isEditing,
        thickness,
        finalColor: fixedColor,
        variableWidth: variableWidthMagnitude,
        arrowFoldback,
        changeIndicator,
        link: opts.linkModel,
        hideArrow: opts.hideArrow,
        transferNotch: isTransferToFlowNode || isAddedToOrSubtractedFrom
      }),
      endpoint: this._endpointOptions("Rectangle", thickness, "node-link-endpoint")
    });

    connection.bind("click", this.handleClick.bind(this));
    connection.bind("dblclick", this.handleDoubleClick.bind(this));
    connection.linkModel = opts.linkModel;
    opts.linkModel.jsPlumbConnection = connection;

    return this.kit.importDefaults({
      Connector: ["Bezier", {curviness: 60, variableWidth: null}]});
  }

  public setSuspendDrawing(shouldwestop) {
    if (!shouldwestop) {
      this._clean_borked_endpoints();
    }
    return this.kit.setSuspendDrawing(shouldwestop, !shouldwestop);
  }

  public suspendDrawing() {
    return this.setSuspendDrawing(true);
  }

  public resumeDrawing() {
    return this.setSuspendDrawing(false);
  }
}
