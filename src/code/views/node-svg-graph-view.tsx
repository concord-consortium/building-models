import * as React from "react";

const _ = require("lodash");
import { CSSProperties } from "react";

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
  unscaled: boolean;
}
type NodeSvgGraphViewProps = NodeSvgGraphViewOuterProps & SimulationMixinProps;

interface NodeSvgGraphViewOuterState {
  xAnimationMultiplier: number;
  yAnimationMultiplier: number;
}
type NodeSvgGraphViewState = NodeSvgGraphViewOuterState & SimulationMixinState;

export class NodeSvgGraphView extends Mixer<NodeSvgGraphViewProps, NodeSvgGraphViewState> {
  public static displayName = "NodeSvgGraphView";

  private xAnimationInterval: number | null = null;
  private xAnimationStartTime: number;

  private yAnimationInterval: number | null = null;
  private yAnimationStartTime: number;

  private mounted: boolean;

  constructor(props: NodeSvgGraphViewProps) {
    super(props);
    this.mixins = [new SimulationMixin(this)];
    const outerState: NodeSvgGraphViewOuterState = {
      xAnimationMultiplier: 0,
      yAnimationMultiplier: 0,
    };
    this.setInitialState(outerState, SimulationMixin.InitialState());
  }

  public render() {
    return (
      <div>
        {this.renderImage()}
        {this.renderSVG()}
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
      } /* else if (prevProps.unscaled !== this.props.unscaled) {

        // start timer to animate rescale after 500ms of no activity
        if (this.props.unscaled) {
          this.clearYAnimationTimeout();
          this.yAnimationTimeout = setTimeout(() => {
            this.startYAnimation();
          }, 500);
        }

        this.clearYAnimationInterval();
        if (this.mounted) {
          if (!this.props.unscaled) {
            this.setState({yAnimationMultiplier: 1}, () => {
              setTimeout(() => {

              })
              this.xAnimationStartTime = Date.now();
              this.xAnimationInterval = window.setInterval(this.handleXAnimationInterval, 10);
            });
          } else {
            this.setState({yAnimationMultiplier: 0});
          }
        }
      } */
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

    if (!this.props.hideGraphs && (this.props.data.length > 0)) {
      if (this.props.isTimeBased) {
        chart = <path d={this.pointsToPath(this.getPathPoints())} strokeWidth={this.props.strokeWidth} stroke={this.props.color} fill="none" />;
        if (this.props.unscaled) {
          ticks = this.getUnscaledTicks();
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
    let { max, min, data } = this.props;
    const { unscaled } = this.props;

    const rangex = SimulationStore.simulationDuration();
    data = _.takeRight(data, rangex).reverse();

    for (const point of data) {
      if (!unscaled && (point > max)) { max = point; }
      if (point < min) { min = point; }
    }
    const rangey = max - min;

    data = _.map(data, (d, i) => {
      const x = i / rangex;
      const y = d / rangey;
      return {x, y};
    });
    return data;
  }

  private getUnscaledTicks() {
    const { max, min, data, width, height } = this.props;
    let pointMax = max;
    let pointMin = min;

    for (const point of data) {
      pointMax = Math.max(pointMax, point);
      pointMin = Math.min(pointMin, point);
    }

    // no ticks unless past max y
    const rangeRatio = (pointMax - pointMin) / (max - min);
    if (rangeRatio <= 1) {
      return null;
    }

    const numTicks = 10;
    const tickWidth = 5;
    const tickStroke = 2;
    const tickSpacing = (height * rangeRatio) / numTicks;
    const tickX = width - tickWidth;
    const ticks: string[] = [];
    for (let i = 0; i < numTicks; i++) {
      const tickY = height - (i * tickSpacing) + tickStroke;
      if (tickY >= 0) {
        ticks.push(`M ${tickX} ${tickY} L ${width} ${tickY}`);
      }
    }

    return <path d={ticks.join(" ")} strokeWidth={tickStroke} stroke={this.props.color} fill="none" />;
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

  private clearXAnimationInterval() {
    if (this.xAnimationInterval) {
      window.clearInterval(this.xAnimationInterval);
    }
  }
}
