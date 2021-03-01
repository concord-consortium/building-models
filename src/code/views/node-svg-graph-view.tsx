import * as React from "react";

const _ = require("lodash");
import { CSSProperties } from "react";
import { urlParams, SHOW_NODE_RANGE } from "../utils/url-params";

// this is to allow Dan to try out different animation times
let autoRescaleTime = parseInt(urlParams.autoRescaleTime || "1500", 10);
if (isNaN(autoRescaleTime)) {
  autoRescaleTime = 1500;
}

const AUTO_RESCALE_TIME = autoRescaleTime;
const TICK_FADE_TIME = 1000;

const NUM_TICKS = 10;
const TICK_WIDTH = 5;
const TICK_STROKE = 2;

interface Range {
  min: number;
  max: number;
}

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { SimulationStore, SimulationMixin, SimulationMixinState, SimulationMixinProps, TIME_BASED_RECORDING_TIME } from "../stores/simulation-store";
import { Mixer } from "../mixins/components";

interface NodeSvgGraphViewOuterProps {
  isTimeBased: boolean;
  width: number;
  height: number;
  strokeWidth: number;
  min: number;
  max: number;
  data: number[];
  color: string;
  currentValue: number;
  innerColor: string;
  image: JSX.Element;
  animateGraphs: boolean;
  hideGraphs: boolean;
  usingSlider: boolean;
  animateRescale: boolean;
  sliderStartMax: number;
}
type NodeSvgGraphViewProps = NodeSvgGraphViewOuterProps & SimulationMixinProps;

interface NodeSvgGraphViewOuterState {
  xAnimationMultiplier: number;
  yAnimationMultiplier: number;
  tickAlpha: number;
}
type NodeSvgGraphViewState = NodeSvgGraphViewOuterState & SimulationMixinState;

export class NodeSvgGraphView extends Mixer<NodeSvgGraphViewProps, NodeSvgGraphViewState> {
  public static displayName = "NodeSvgGraphView";

  private xAnimationInterval: number | null = null;
  private xAnimationStartTime: number;

  private yAnimationInterval: number | null = null;
  private yAnimationStartTime: number;

  private tickFadeInterval: number | null = null;
  private tickFadeStartTime: number;

  private mounted: boolean;

  constructor(props: NodeSvgGraphViewProps) {
    super(props);
    this.mixins = [new SimulationMixin(this)];
    const outerState: NodeSvgGraphViewOuterState = {
      xAnimationMultiplier: 1,
      yAnimationMultiplier: 1,
      tickAlpha: 0,
    };
    this.setInitialState(outerState, SimulationMixin.InitialState());
  }

  public render() {
    return (
      <div>
        {this.renderImage()}
        {this.renderSVG()}
        {this.renderNodeRange()}
      </div>
    );
  }

  public componentDidMount() {
    this.mounted = true;
  }

  public componentWillUnmount() {
    this.mounted = false;
    this.clearXAnimationInterval();
  }

  public componentDidUpdate(prevProps: NodeSvgGraphViewProps) {
    if (this.props.isTimeBased) {
      if (prevProps.animateGraphs !== this.props.animateGraphs) {
        this.clearXAnimationInterval();
        if (this.mounted) {
          if (this.props.animateGraphs) {
            this.setState({xAnimationMultiplier: 0}, () => {
              this.xAnimationStartTime = Date.now();
              this.xAnimationInterval = window.setInterval(this.handleXAnimationInterval, 10);
            });
          } else {
            this.setState({xAnimationMultiplier: 1});
          }
        }
      } else if (prevProps.usingSlider !== this.props.usingSlider) {

        this.clearYAnimationInterval();
        this.clearTickFadeInterval();
        if (this.mounted) {
          if (this.props.animateRescale) {
            this.setState({yAnimationMultiplier: 0, tickAlpha: 1}, () => {
              this.yAnimationStartTime = Date.now();
              this.yAnimationInterval = window.setInterval(this.handleYAnimationInterval, 10);
            });
          } else {
            this.setState({yAnimationMultiplier: 1, tickAlpha: 0});
          }
        }
      }
    }
  }

  private renderImage() {
    const imageOffset = 2;
    const imageStyle: CSSProperties = {
      position: "absolute",
      top: imageOffset,
      left: imageOffset,
      opacity: 0.25,
      width: this.props.width + imageOffset,
      height: this.props.height + imageOffset
    };

    return <div style={imageStyle}>{this.props.image}</div>;
  }

  private renderSVG() {
    let chart: JSX.Element | null = null;
    let ticks: JSX.Element | null = null;
    const svgOffset = 3;
    const svgStyle: CSSProperties = {
      position: "absolute",
      top: svgOffset,
      left: svgOffset
    };
    const {tickAlpha} = this.state;

    if (!this.props.hideGraphs && (this.props.data.length > 0)) {
      if (this.props.isTimeBased) {
        const {points, tickHeight} = this.getPathPoints();
        chart = <path d={this.pointsToPath(points)} strokeWidth={this.props.strokeWidth} stroke={this.props.color} fill="none" />;
        if (tickAlpha > 0) {
          ticks = this.getAnimatedTicks(tickHeight, tickAlpha);
        }
      } else {
        chart = <path d={this.getBarPath()} strokeWidth={this.props.strokeWidth} stroke={this.props.color} fill={this.props.innerColor} />;
      }
    }

    return (
      <svg style={svgStyle} width={this.props.width} height={this.props.height}>
        {chart}
        {ticks}
      </svg>
    );
  }

  private renderNodeRange() {
    if (SHOW_NODE_RANGE) {
      const {pointMax} = this.getPathPoints();
      const {currentValue, max} = this.props;
      return <div className="node-range">{Math.round(currentValue)} / {Math.round(pointMax)}</div>;
    }
  }

  private invertPoint(point) {
    return {x: this.props.width - point.x, y: this.props.height - point.y};
  }

  private graphMapPoint(point) {
    const x = point.x * this.props.width;
    const y = (this.props.strokeWidth - 1) + (point.y * (this.props.height - (this.props.strokeWidth + 1)));
    return this.invertPoint({x, y});
  }

  private pointsToPath(points) {
    let data = _.map(points, p => this.graphMapPoint(p));
    if (this.props.animateGraphs) {
      const animationMaxX = this.props.width * this.state.xAnimationMultiplier;
      data = _.filter(data, (d) => {
        return d.x <= animationMaxX;
      });
    }
    data = _.map(data,   p => `${p.x} ${p.y}`);
    data = data.join(" L ");
    if (data.length > 0) {
      return `M ${data}`;
    }
    return "";
  }

  private getPathPoints() {
    const { max, min, data, animateRescale, usingSlider, sliderStartMax, height } = this.props;
    const { yAnimationMultiplier } = this.state;

    const rangeX = SimulationStore.simulationDuration();
    const trailingData = _.takeRight(data, rangeX).reverse();

    if (trailingData.length === 0) {
      return {points: [], tickHeight: 0, pointMin: 0, pointMax: 0};
    }

    const animating = animateRescale && (yAnimationMultiplier < 1);

    const graphRange: Range = {min, max: animating || usingSlider ? sliderStartMax : max};
    const dataRange: Range = {min, max};
    for (const point of trailingData) {
      dataRange.min = Math.min(point, dataRange.min);
      dataRange.max = Math.max(point, dataRange.max);
    }
    const graphDiff = graphRange.max - graphRange.min;
    const dataDiff = dataRange.max - dataRange.min;

    let rangeY;
    let tickHeight;
    if (animating) {
      const finalTickHeight = max - min;
      const startTickHeight = finalTickHeight * (dataRange.max / graphRange.max);
      tickHeight = height * ((startTickHeight + ((finalTickHeight - startTickHeight) * yAnimationMultiplier)) / finalTickHeight);
      rangeY = graphDiff - ((graphDiff - dataDiff) * yAnimationMultiplier);
    } else if (usingSlider) {
      rangeY = graphDiff;
    } else {
      rangeY = dataDiff;
    }

    const points = _.map(trailingData, (d, i) => {
      const x = i / rangeX;
      const y = d / rangeY;
      return {x, y};
    });

    return {points, tickHeight, pointMin: dataRange.min, pointMax: dataRange.max};
  }

  private getAnimatedTicks(tickHeight: number, tickAlpha: number) {
    const { width, height } = this.props;

    const tickSpacing = tickHeight / NUM_TICKS;
    const tickX = width - TICK_WIDTH;
    const ticks: string[] = [];
    for (let i = 0; i < NUM_TICKS; i++) {
      const tickY = height - (i * tickSpacing) - TICK_STROKE;
      if (tickY >= 0) {
        ticks.push(`M ${tickX} ${tickY} L ${width} ${tickY}`);
      }
    }

    return <path d={ticks.join(" ")} strokeWidth={TICK_STROKE} stroke={this.props.color} fill="none" strokeOpacity={tickAlpha} />;
  }

  private getBarPath() {
    const { max }  = this.props;
    const { min }  = this.props;
    let val = Math.min(max, Math.max(min, this.props.currentValue));
    val = (val / (max - min));

    const left = this.props.width * 0.25;
    const right = this.props.width * 0.75;
    const bottom = this.props.height;
    const top = this.props.height - ((this.props.strokeWidth - 1) + (val * (this.props.height - (this.props.strokeWidth + 1))));

    let data = [{x: left, y: bottom}, {x: left, y: top}, {x: right, y: top}, {x: right, y: bottom}];
    data = _.map(data,   p => `${p.x} ${p.y}`);
    return `M ${data.join(" L ")}`;
  }

  private handleXAnimationInterval = () => {
    const delta = Date.now() - this.xAnimationStartTime;
    if (this.mounted) {
      const xAnimationMultiplier = Math.min(delta / TIME_BASED_RECORDING_TIME, 1);
      this.setState({xAnimationMultiplier});
      if (xAnimationMultiplier === 1) {
        this.clearXAnimationInterval();
      }
    }
  }

  private handleYAnimationInterval = () => {
    const delta = Date.now() - this.yAnimationStartTime;
    if (this.mounted) {
      const yAnimationMultiplier = Math.min(delta / AUTO_RESCALE_TIME, 1);
      this.setState({yAnimationMultiplier});
      if (yAnimationMultiplier === 1) {
        this.clearYAnimationInterval();
        if (this.state.tickAlpha !== 0) {
          this.tickFadeStartTime = Date.now();
          this.tickFadeInterval = window.setInterval(this.handleTickFadeInterval, 10);
        }
      }
    }
  }

  private handleTickFadeInterval = () => {
    const delta = Date.now() - this.tickFadeStartTime;
    if (this.mounted) {
      const tickAlpha = Math.max(1 - (delta / TICK_FADE_TIME), 0);
      this.setState({tickAlpha});
      if (tickAlpha === 0) {
        this.clearTickFadeInterval();
      }
    }
  }

  private clearXAnimationInterval() {
    if (this.xAnimationInterval) {
      window.clearInterval(this.xAnimationInterval);
    }
  }

  private clearYAnimationInterval() {
    if (this.yAnimationInterval) {
      window.clearInterval(this.yAnimationInterval);
    }
  }

  private clearTickFadeInterval() {
    if (this.tickFadeInterval) {
      window.clearInterval(this.tickFadeInterval);
    }
  }
}
