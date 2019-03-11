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
}
type NodeSvgGraphViewProps = NodeSvgGraphViewOuterProps & SimulationMixinProps;

interface NodeSvgGraphViewOuterState {
  animationMultiplier: number;
}
type NodeSvgGraphViewState = NodeSvgGraphViewOuterState & SimulationMixinState;

export class NodeSvgGraphView extends Mixer<NodeSvgGraphViewProps, NodeSvgGraphViewState> {
  public static displayName = "NodeSvgGraphView";

  private animationInterval: number | null = null;
  private animationStartTime: number;

  private mounted: boolean;

  constructor(props: NodeSvgGraphViewProps) {
    super(props);
    this.mixins = [new SimulationMixin(this)];
    const outerState: NodeSvgGraphViewOuterState = {animationMultiplier: 0};
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
    this.clearAnimationInterval();
  }

  public componentDidUpdate(prevProps: NodeSvgGraphViewProps) {
    if (this.props.isTimeBased && (prevProps.animateGraphs !== this.props.animateGraphs)) {
      this.clearAnimationInterval();
      if (this.mounted) {
        if (this.props.animateGraphs) {
          this.setState({animationMultiplier: 0}, () => {
            this.animationStartTime = Date.now();
            this.animationInterval = window.setInterval(this.handleAnimationInterval, 10);
          });
        } else {
          this.setState({animationMultiplier: 1});
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
    let chart;
    const svgOffset = 3;
    const svgStyle: CSSProperties = {
      position: "absolute",
      top: svgOffset,
      left: svgOffset
    };

    if (this.props.data.length > 0) {
      if (this.props.isTimeBased) {
        chart = <path d={this.pointsToPath(this.getPathPoints())} strokeWidth={this.props.strokeWidth} stroke={this.props.color} fill="none" />;
      } else {
        chart = <path d={this.getBarPath()} strokeWidth={this.props.strokeWidth} stroke={this.props.color} fill={this.props.innerColor} />;
      }
    } else {
      chart = null;
    }

    return (
      <svg style={svgStyle} width={this.props.width} height={this.props.height}>
        {chart}
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
      const animationMaxX = this.props.width * this.state.animationMultiplier;
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
    let { max }  = this.props;
    let { min }  = this.props;
    let { data } = this.props;

    const rangex = SimulationStore.simulationDuration();
    data = _.takeRight(data, rangex).reverse();

    for (const point of data) {
      if (point > max) { max = point; }
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

  private handleAnimationInterval = () => {
    const delta = Date.now() - this.animationStartTime;
    if (this.mounted) {
      const animationMultiplier = Math.min(delta / TIME_BASED_RECORDING_TIME, 1);
      this.setState({animationMultiplier});
      if (animationMultiplier === 1) {
        this.clearAnimationInterval();
      }
    }
  }

  private clearAnimationInterval() {
    if (this.animationInterval) {
      window.clearInterval(this.animationInterval);
    }
  }
}
