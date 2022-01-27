const _ = require("lodash");
import * as React from "react";
import * as $ from "jquery";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { tr } from "../utils/translate";
import { Link } from "../models/link";
import { GraphStoreClass } from "../stores/graph-store";
const math = require("mathjs");  // For formula parsing...

interface SvgGraphViewPoint {
  x: number;
  y: number;
  time: number;
}

interface SvgGraphViewProps {
  link: Link;
  width: number;
  height: number;
  fontSize: number;
  strokeWidth: number;
  graphStore: GraphStoreClass;
  strokeDasharray: string;
  xLabel: string;
  yLabel: string;
}

interface SvgGraphViewState {
  currentData: SvgGraphViewPoint[] | null;
  pointPathData: SvgGraphViewPoint[] | null;
  canDraw: boolean;
  definedRelationship: boolean;
  newCustomData: boolean;
  formula: string | null;
}

export class SvgGraphView extends React.Component<SvgGraphViewProps, SvgGraphViewState> {

  public static displayName = "SvgGraphView";

  public state: SvgGraphViewState = {
    currentData: null,
    pointPathData: null,
    // control state of the graph rendering
    canDraw: false,
    definedRelationship: false,
    // rendering style toggle for new custom relationships
    newCustomData: false,
    formula: null,
  };

  private drawing = false;
  private _lastPoint: SvgGraphViewPoint;
  private graphBody: HTMLDivElement | null;

  /*
  getDefaultProps() {
    return {
      width: 200,
      height: 200,
      strokeWidth: 3,
      strokeDasharray: "10,6",
      fontSize: 16,
      xLabel: "x axis",
      yLabel: "y axis",
      link: null
    };
  },
  */

  public componentWillMount() {
    let canDraw = false;
    const currentData = this.props.link.relation.customData;
    const { isDefined } = this.props.link.relation;
    let { formula } = this.props.link.relation;
    let newCustomData = false;

    if (this.props.link.relation.isCustomRelationship || ((currentData != null) && isDefined)) {
      canDraw = true;
      formula = null;
      newCustomData = (currentData == null);
    }

    this.setState({
      currentData,
      canDraw,
      newCustomData,
      definedRelationship: isDefined
    });

    if ((this.state.pointPathData == null) && isDefined) {
      if (currentData != null) {
        return this.updatePointData(null, currentData);
      } else if (formula != null) {
        return this.updatePointData(formula, null);
      }
    }
  }

  public componentWillReceiveProps(newProps) {
    if (newProps) {
      let newCustomData;
      let canDraw = false;
      let currentData = newProps.link.relation.customData;
      const { isDefined } = newProps.link.relation;
      let { formula } = newProps.link.relation;

      if (newProps.link.relation.isCustomRelationship || ((currentData != null) && isDefined)) {
        canDraw = true;
        if (!isDefined) {
          newCustomData = true;
          formula = "1 * 1";
        } else {
          formula = null;
        }

      } else if (formula != null) {
        canDraw = false;
        newCustomData = false;
        currentData = null;
      }

      this.setState({
        currentData,
        pointPathData: null,
        canDraw,
        newCustomData,
        definedRelationship: isDefined
      });

      return this.updatePointData(formula, currentData);
    }
  }

  public render() {
    const drawClass = `draw-graph${this.state.canDraw ? " drawing" : ""}`;
    return (
      <div className="svgGraphView">
        <svg width={this.props.width} height={this.props.height}>
          {this.renderAxisLines()}
          {this.renderLineData()}
          {this.renderXLabel()}
          {this.renderYLabel()}
        </svg>
        <div
          className={drawClass}
          onMouseDown={this.handleStartDrawCurve}
          onTouchStart={this.handleStartDrawCurve}
          ref={(el) => this.graphBody = el}
        />
        {this.state.newCustomData ? this.renderCustomHint() : null}
        {!this.state.newCustomData && !this.state.definedRelationship ? this.renderUnknownGraph() : null}
      </div>
    );
  }

  private renderCustomHint() {
    return (
      <div className="graph-hint">
        <span>{`${tr("~NODE-RELATION-EDIT.CUSTOM_HINT")} `}</span>
      </div>
    );
  }

  private renderUnknownGraph() {
    return <div className="unknown-graph">?</div>;
  }

  private updatePointData(formula, currentData) {
    if ((currentData == null) && (formula != null)) {
      currentData = this.loadCustomDataFromFormula(formula);
    } else if (currentData != null) {
      this.setState({ definedRelationship: true });
    }
    const pointPathData = this.getPathPoints(currentData);
    return this.setState({currentData, pointPathData});
  }

  private marginal() {
    return this.props.fontSize * 0.4;
  }

  private margin() {
    return this.props.fontSize + this.marginal();
  }

  private invertPoint(point) {
    return {x: point.x, y: this.props.height - point.y};
  }

  private graphMapPoint(point) {
    const yOffset = this.margin();
    const xOffset = this.margin();
    const width   = this.props.width  - (xOffset + this.props.strokeWidth);
    const height  = this.props.height - (yOffset + this.props.strokeWidth);
    const x = (point.x * width) + xOffset;
    const y = (point.y * height) + yOffset;
    return this.invertPoint({x, y});
  }

  private findClosestPoint(path, pointX, pointY) {
    const graphOrigin = this.graphMapPoint({x: 0, y: 0});
    const offset = $(path).offset() || {left: 0, top: 0};
    const x = pointX - offset.left;
    const y = pointX - offset.top;
    const p = {x, y};
    return p;
  }

  private pointsToPath(points) {
    let data = _.map(points, p => this.graphMapPoint(p));
    data = _.map(data,   p => `${p.x} ${p.y}`);
    data = data.join(" L ");
    return `M ${data}`;
  }

  private loadCustomDataFromFormula(formula) {
    const rangex = 100;
    let data = _.range(0, rangex);
    let miny = Infinity;
    let maxy = -Infinity;
    return data = _.map(data, (x) => {
      let y;
      const scope = {in: x, out: 0, maxIn: rangex, maxOut: rangex};
      try {
        y = math.eval(formula, scope);
        if (y < miny) { miny = y; }
        if (y > maxy) { maxy = y; }
      } catch (error) {
        console.error(`Error: ${error}`); // tslint:disable-line:no-console
      }
      return [x, y];
    });
  }

  private getPathPoints(currentData) {
    const rangex = 100;
    let data = _.range(0, rangex);
    let miny = Infinity;
    let maxy = -Infinity;
    if (currentData != null) {
      data = _.map(currentData, (point) => {
        const x = _.first(point);
        const y = _.last(point);
        if (y < miny) { miny = y; }
        if (y > maxy) { maxy = y; }
        return { y, x};
      });
    }

    data = _.map(data, (d) => {
      let {x, y} = d;
      x = x / rangex;
      y = y / rangex;
      return {x, y};
    });
    return data;
  }

  private renderXLabel() {
    const y = (this.props.height - this.props.fontSize) + (2 * this.marginal());
    return (
      <text className="xLabel" x={this.margin()} y={y}>
        {this.props.xLabel}
      </text>
    );
  }

  private renderYLabel() {
    const rotate = `rotate(-90 0, ${this.props.height})`;
    const translate =  `translate(${this.props.fontSize})`;
    const transform = `${rotate}`;
    const y = (this.props.height + this.props.fontSize) - 3;
    return (
      <text className="yLabel" x={this.margin()} y={y} transform={transform}>
        {this.props.yLabel}
      </text>
    );
  }

  private renderAxisLines() {
    const data = [ {x: 0, y: 1}, {x: 0, y: 0}, {x: 1, y: 0}];
    return <path className="axisLines" d={this.pointsToPath(data)} />;
  }

  private renderLineData() {
    if (this.state.definedRelationship) {
      const data = this.pointsToPath(this.state.pointPathData);
      if (this.state.newCustomData) {
        return <path className="data" d={data} strokeWidth={this.props.strokeWidth} strokeDasharray={this.props.strokeDasharray} />;
      } else {
        return <path className="data" d={data} strokeWidth={this.props.strokeWidth} />;
      }
    }
  }

  private handleStartDrawCurve = (e) => {
    // can only draw on custom relationships
    if (this.state.canDraw) {
      e.preventDefault();
      e.stopPropagation();

      document.addEventListener("mousemove", this.handleDrawCurve, true);
      document.addEventListener("touchmove", this.handleDrawCurve, true);
      document.addEventListener("mouseup", this.handleEndDrawCurve, true);
      document.addEventListener("touchend", this.handleEndDrawCurve, true);
      this.drawing = true;

      if (this.state.newCustomData) {
        const scaledCoords = this.pointToScaledCoords(e);
        const starterFunction = `1 * ${scaledCoords.y}`;
        this.updatePointData(starterFunction, null);
        const newCustomData = false;
        // persist the synthetic event so handleDrawCurve can use it
        e.persist();
        this.setState({newCustomData}, () => this.handleDrawCurve(e));
      } else {
        this.handleDrawCurve(e);
      }
    }
  }

  private handleDrawCurve = (e) => {
    if (this.drawing && !this.state.newCustomData) {
      e.preventDefault();
      e.stopPropagation();

      const scaledCoords = this.pointToScaledCoords(e);

      const x = Math.round(scaledCoords.x);
      const { y } = scaledCoords;

      // sanity check, but it shouldn't be possible to be out of bounds with our scaledCoords
      if ((x < 0) || (x > 100) || (y < 0) || (y > 100)) { return; }

      // our data is ordered in the format [[0, y], [1, y], [2, y], ...]
      // so we can set a new x, y simply using data[x] = [x, y]

      const newData = _.clone(this.state.currentData);

      const currentTime = Date.now();
      if (this._lastPoint && (this._lastPoint.x !== x) && ((currentTime - this._lastPoint.time) < 100)) {
        // if our last point was < 100ms ago, this is probably the mouse moving across the canvas,
        // so interpolate all the points between that point and this point
        const minX = Math.min(x, this._lastPoint.x);
        const maxX = Math.max(x, this._lastPoint.x);
        const minY = x < this._lastPoint.x ? y : this._lastPoint.y;
        const maxY = x < this._lastPoint.x ? this._lastPoint.y : y;
        const steps = maxX - minX;
        const yStep = (maxY - minY) / steps;
        for (let i = 0, end = steps, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
          const interpolatedX = minX + i;
          const interpolatedY = minY + (yStep * i);
          newData[interpolatedX] = [interpolatedX, interpolatedY];
        }
      } else {
        // otherwise, just set this point
        newData[x] = [x, y];
      }

      this.updatePointData(this.props.link.relation.formula, newData);

      return this._lastPoint = {x, y, time: currentTime};
    }
  }

  private handleEndDrawCurve = (e) => {
    if (this.drawing) {
      e.preventDefault();
      e.stopPropagation();

      document.removeEventListener("mousemove", this.handleDrawCurve);
      document.removeEventListener("touchmove", this.handleDrawCurve);
      document.removeEventListener("mouseup", this.handleEndDrawCurve);
      document.removeEventListener("touchend", this.handleEndDrawCurve);
      this.drawing = false;
      // update relation with custom data
      this.updateRelationCustomData(this.state.currentData);
    }
    return delete this._lastPoint;
  }

  private pointToScaledCoords(e) {
    const {clientX, clientY} = e.touches ? e.touches[0] : e;
    const rect = this.graphBody ? this.graphBody.getBoundingClientRect() : {width: 0, height: 0, right: 0, bottom: 0 };
    const coords = {x: rect.width - (rect.right - clientX), y: rect.bottom - clientY};
    coords.x = Math.max(0, Math.min(coords.x, rect.width));
    coords.y = Math.max(0, Math.min(coords.y, rect.height));
    const scaledCoords = {x: Math.round((coords.x / rect.width) * 100), y: Math.round((coords.y / rect.height) * 100)};
    return scaledCoords;
  }

  private updateRelationCustomData(customData) {
    const { link } = this.props;
    link.relation.customData = customData;
    link.relation.isDefined = (customData != null);
    return this.props.graphStore.changeLink(link, {relation: link.relation});
  }
}
