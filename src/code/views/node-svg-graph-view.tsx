import { CSSProperties } from "react";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const SimulationStore = require("../stores/simulation-store");

module.exports = React.createClass({
  displayName: "NodeSvgGraphView",
  mixins: [ SimulationStore.mixin ],

  getDefaultProps() {
    return {
      width: 48,
      height: 48,
      strokeWidth: 3,
      min: 0,
      max: 100,
      data: [],
      color: "#aaa"
    };
  },

  invertPoint(point) {
    return {x: this.props.width - point.x, y: this.props.height - point.y};
  },

  graphMapPoint(point) {
    const x = point.x * this.props.width;
    const y = (this.props.strokeWidth - 1) + (point.y * (this.props.height - (this.props.strokeWidth + 1)));
    return this.invertPoint({x, y});
  },

  pointsToPath(points) {
    let data = _.map(points, p => this.graphMapPoint(p));
    data = _.map(data,   p => `${p.x} ${p.y}`);
    data = data.join(" L ");
    return `M ${data}`;
  },

  getPathPoints() {
    let { max }  = this.props;
    let { min }  = this.props;
    let { data } = this.props;

    const rangex = SimulationStore.store.simulationDuration();
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
  },

  getBarPath() {
    const { max }  = this.props;
    const { min }  = this.props;
    let val = Math.min(max, Math.max(min, this.props.currentValue));
    val = val / (max - min);

    const left = this.props.width * 0.25;
    const right = this.props.width * 0.75;
    const bottom = this.props.height;
    const top = this.props.height - ((this.props.strokeWidth - 1) + (val * (this.props.height - (this.props.strokeWidth + 1))));

    let data = [{x: left, y: bottom}, {x: left, y: top}, {x: right, y: top}, {x: right, y: bottom}];
    data = _.map(data,   p => `${p.x} ${p.y}`);
    return `M ${data.join(" L ")}`;
  },

  renderImage() {
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
  },

  renderSVG() {
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
  },

  render() {
    return (
      <div>
        {this.renderImage()}
        {this.renderSVG()}
      </div>
    );
  }
});
