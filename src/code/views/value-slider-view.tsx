import * as React from "react";

const tr = require("../utils/translate");

const circleRadius = 2;
const constants = {
  orientation: {
    horizontal: {
      dimension: "width",
      direction: "left",
      coordinate: "x"
    },
    vertical: {
      dimension: "height",
      direction: "top",
      coordinate: "y"
    }
  }
};

interface SVGSliderViewProps {
  min: number;
  max: number;
  value: number;
  onValueChange?: (value: number) => void;
  onRangeChange?: (range: any) => void; // TODO: get concrete type
  orientation: any; // TODO: get concrete type
  width: number;
  height: number;
  handleSize: number;
  renderValueTooltip: boolean;
  displayPrecision: any; // TODO: get concrete type
  onSliderDragStart?: () => void;
  onSliderDragEnd?: () => void;
  stepSize: number;
  displaySemiQuant: boolean;
  minLabel: string | null;
  maxLabel: string | null;
  showTicks: boolean;
  filled: boolean;
  color: string;
  showHandle: boolean;
  showLabels: boolean;
}

interface SVGSliderViewState {
  limit: number;
  grab: number;
  dragging: boolean;
  "editing-min": boolean;
  "editing-max": boolean;
}

export class SVGSliderView extends React.Component<SVGSliderViewProps, SVGSliderViewState> {

  public static displayName = "SVGSliderView";

  public state: SVGSliderViewState = {
    limit: 0,
    grab: 0,
    dragging: false,
    "editing-min": false,
    "editing-max": false
  };

  private slider: any; // TODO: get concrete type
  private handle: any; // TODO: get concrete type
  private input: HTMLInputElement | null;

  /*
  getDefaultProps() {
    return {
      width:  72,
      height: 20,
      min: 0,
      max: 100,
      value: 50,
      handleSize: 16,
      minEditable: false,
      maxEditable: false,
      stepSize: 1,
      showTicks: false,
      showLabels: true,
      showHandle: true,
      snapToSteps: false,
      displayPrecision: 0,
      renderValueTooltip: true,
      minLabel: null,
      maxLabel: null,
      displaySemiQuant: false,
      orientation: "horizontal",
      color: "gray",
      filled: false,
      onValueChange(v) {
        return log.info(`new value ${v}`);
      },
      onRangeChange(r) {
        return log.info(`new range ${r.min}, ${r.max}`);
      }
    };
  },
  */

  public componentDidMount() {
    window.addEventListener("resize", this.handleUpdate);
    return this.handleUpdate();
  }

  public componentWillUnmount() {
    return window.removeEventListener("resize", this.handleUpdate);
  }

  public render() {
    const { orientation, width, height, filled, showHandle, showLabels } = this.props;
    const horizontal = orientation === "horizontal";
    const lengendHeight = 9 + 4.5;
    const style = {
      padding: "0px",
      border: "0px",
      width: width + (!horizontal && !filled ? lengendHeight : 0),
      height: height + (horizontal ? lengendHeight : 0)
    };
    let classNames = `value-slider${showHandle ? " show-handle" : " no-handle"}`;
    if (!horizontal) { classNames += " vertical"; }
    if (filled) { classNames += " filled"; }
    return (
      <div
        className={classNames}
        style={style}
        ref={s => this.slider = s}
        onMouseDown={showHandle ? this.handleJumpAndDrag : this.handleNoop}
        onTouchStart={showHandle ? this.handleJumpAndDrag : this.handleNoop}
        onTouchEnd={this.handleNoop}
      >
        <svg className="svg-background" width={`${width}px`} height={`${height}px`} viewBox={`0 0 ${width} ${height}`}>
          {this.renderLine()}
          {filled ? this.renderFill() : undefined}
        </svg>
        {showHandle ? this.renderHandle() : undefined}
        {showLabels ? this.renderLegend() : undefined}
      </div>
    );
  }

  private updateRange(property, value) {
    const range = {
      min: this.props.min,
      max: this.props.max
    };
    range[property] = value;

    // normalize
    if (property === "max") {
      range.min = Math.min(range.min, range.max);
    } else {
      range.max = Math.max(range.min, range.max);
    }
    if ((this.props.value < range.min) || (this.props.value > range.max)) {
      value = Math.max(range.min, Math.min(range.max, this.props.value));
      if (this.props.onValueChange) {
        this.props.onValueChange(value);
      }
    }
    if (this.props.onRangeChange) {
      this.props.onRangeChange(range);
    }
  }

  private handleUpdate = () => {
    const { orientation } = this.props;
    let { dimension } = constants.orientation[orientation];
    dimension = dimension.charAt(0).toUpperCase() + dimension.substr(1);
    const sliderPos = this.slider[`offset${dimension}`];
    const handlePos = (this.handle != null ? this.handle[`offset${dimension}`] : undefined) || 0;

    return this.setState({
      limit: sliderPos - handlePos,
      grab: handlePos / 2
    });
  }

  private sliderLocation() {
    return this.clamp((this.props.value - this.props.min) / (this.props.max - this.props.min), 0, 1);
  }

  private sliderPercent() {
    const p = this.sliderLocation() * 100;
    if (this.props.orientation === "horizontal") {
      return p;
    } else {
      return 100 - p;
    }
  }

  private thickness() {
    if (this.props.orientation === "horizontal") { return this.props.height; } else { return this.props.width; }
  }

  private length() {
    if (this.props.orientation === "horizontal") { return this.props.width; } else { return this.props.height; }
  }

  private renderNumber() {
    const style: any = {bottom: `${this.props.handleSize}px`};

    if (this.state.dragging && this.props.renderValueTooltip) {
      style.display = "block";
    }
    return <div className="number" style={style}>{this.props.value.toFixed(this.props.displayPrecision)}</div>;
  }

  private handleNoop = (e) => {
    e.stopPropagation();
    e.preventDefault();
  }

  private handleStart = (e) => {
    this.handleNoop(e);
    if (this.props.onSliderDragStart) {
      this.props.onSliderDragStart();
    }
    document.addEventListener("mousemove", this.handleDrag);
    return document.addEventListener("mouseup",   this.handleEnd);
  }

  private handleEnd = () => {
    if (this.props.onSliderDragEnd) {
      this.props.onSliderDragEnd();
    }
    document.removeEventListener("mousemove", this.handleDrag);
    return document.removeEventListener("mouseup",   this.handleEnd);
  }

  private handleDrag = (e) => {
    this.handleNoop(e);
    const { onValueChange } = this.props;
    if (onValueChange == null) { return; }

    const value = this.position(e);
    if (value !== this.props.value) {
      return onValueChange(value);
    }
  }

  private handleJumpAndDrag = (e) => {
    this.handleDrag(e);
    return this.handleStart(e);
  }

  private clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  private getValueFromPosition(pos) {
    let value;
    const { limit } = this.state;
    const { orientation, min, max, stepSize } = this.props;
    const percentage = (this.clamp(pos, 0, limit) / (limit || 1));
    const baseVal = stepSize * Math.round((percentage * (max - min)) / stepSize);

    if (orientation === "horizontal") {
      value = baseVal + min;
    } else {
      value = max - baseVal;
    }

    return this.clamp(value, min, max);
  }

  private position(e) {
    const { grab } = this.state;
    const { orientation } = this.props;
    const node = this.slider;
    const coordinateStyle = constants.orientation[orientation].coordinate;
    const directionStyle = constants.orientation[orientation].direction;
    const clientCoordinateStyle = `client${coordinateStyle.toUpperCase()}`;
    const coordinate = !e.touches ? e[clientCoordinateStyle] : e.touches[0][clientCoordinateStyle];
    const direction = node.getBoundingClientRect()[directionStyle];

    const pos = coordinate - direction - grab;
    const value = this.getValueFromPosition(pos);

    return value;
  }

  private renderHandle() {
    let height;
    const { orientation, handleSize, displaySemiQuant } = this.props;
    const width = (height = `${handleSize}px`);
    const centerOfDiv = `${this.sliderPercent()}%`;
    const outerEdge = Math.round((this.thickness() - handleSize) / 2.0 );
    const style: any = {
      "width": width,
      "height": height,
      "fontSize": `${handleSize / 2}px`
    };

    if (orientation === "horizontal") {
      style.top  = `${outerEdge}px`;
      style.left = centerOfDiv; // margin will take care of the rest?
      style.marginLeft = `-${handleSize / 2}px`;
      style.marginRight = `-${handleSize / 2}px`;
    } else {
      style.left  = `${outerEdge}px`;
      style.top = centerOfDiv;
      style.marginTop = `-${handleSize / 2}px`;
      style.marginBottom = `-${handleSize / 2}px`;
    }

    const label = !displaySemiQuant ? this.renderNumber() : null;

    let classNames = "icon-codap-smallSliderLines";
    if (orientation !== "horizontal") { classNames += " rotated"; }

    return (
      <div
        className="value-slider-handle"
        style={style}
        ref={(el) => this.handle = el}
        onMouseDown={this.handleStart}
        onTouchEnd={this.handleNoop}
        onTouchMove={this.handleDrag}
      >
        <i className={classNames} />
        {label}
      </div>
    );
  }

  private renderEditableProperty(property: "min" | "max") {
    const isEditable = this.props[`${property}Editable`];
    const key = `editing-${property}`;

    const swapState = () => {
      // if not editable, ignore
      if (!isEditable) { return; }
      // first copy state value to model if we were editing
      if (this.state[key] && this.input) {
        this.updateRange(property, parseInt(this.input.value, 10));
      }
      const toggleValue = !this.state[key];
      const focus = () => this.input ? this.input.focus() : undefined;
      if (property === "min") {
        this.setState({"editing-min": toggleValue}, focus);
      } else {
        this.setState({"editing-max": toggleValue}, focus);
      }
    };

    const keyDown = (evt) => {
      if (evt.key === "Enter") {
        return swapState();
      }
    };

    let classNames = property;
    if (isEditable) { classNames += " editable"; }

    if (!this.state[key]) {
      return <div className={classNames} onClick={swapState}>{this.props[property]}</div>;
    } else {
      return (
        <input
          className={property}
          type="number"
          value={this.props[property]}
          onBlur={swapState}
          onKeyDown={keyDown}
          ref={(el) => this.input = el}
        />
      );
    }
  }

  private renderLegend() {
    const { minLabel, maxLabel, displaySemiQuant, orientation, width } = this.props;

    const min = minLabel ||
      (displaySemiQuant ? tr("~NODE-VALUE-EDIT.LOW") : this.renderEditableProperty("min"));
    const max = maxLabel ||
      (displaySemiQuant ? tr("~NODE-VALUE-EDIT.HIGH") : this.renderEditableProperty("max"));

    if (orientation === "horizontal") {
      return <div className="legend">min, max</div>;
    } else {
      return <div className="legend" style={{left: width / 1.7}}>max, min</div>;
    }
  }

  private renderTicks() {
    const { showTicks, max, min, stepSize, orientation } = this.props;
    if (!showTicks) { return; }

    const center = this.thickness() / 2;
    const numTicks = ((max - min) / stepSize);
    const tickDistance = this.length() / numTicks;
    const tickHeight = circleRadius * 1.5;
    const ticks: any[] = [];
    for (let j = 1, end = numTicks, asc = 1 <= end; asc ? j < end : j > end; asc ? j++ : j--) {
      if (orientation === "horizontal") {
        ticks.push(<path key={j} d={`M${j * tickDistance} ${center - tickHeight} l 0 ${tickHeight * 2}`} className="slider-line" />);
      } else {
        ticks.push(<path key={j} d={`M${center - tickHeight} ${j * tickDistance} l ${tickHeight * 2} 0`} className="slider-line" />);
      }
    }
    return ticks;
  }

  private renderLine() {
    let filled, height, orientation, width;
    ({ filled, orientation, width, height } = this.props);
    const center = this.thickness() / 2;
    let inset = circleRadius;
    if (filled) { inset += 1; }
    if (orientation === "horizontal") {
      return (
        <g>
          <path d={`M${inset} ${center} l ${width - (inset * 2)} 0`} className="slider-line" stroke="#ccc" />
          {!filled ?
            <g>
              <circle cx={circleRadius} cy={center} r={circleRadius} className="slider-shape" stroke="#ccc" />
              <circle cx={width - circleRadius} cy={center} r={circleRadius} className="slider-shape" />
            </g> : undefined}
          {this.renderTicks()}
        </g>
      );
    } else {
      return (
        <g>
          <path d={`M${center} ${inset} l 0 ${height - (inset * 2)}`} className="slider-line" stroke="#ccc" />
          {!filled ?
            <g>
              <circle cx={center} cy={circleRadius} r={circleRadius} className="slider-shape" stroke="#ccc" />
              <circle cx={center} cy={height - circleRadius} r={circleRadius} className="slider-shape" />
            </g> : undefined}
          {this.renderTicks()}
        </g>
      );
    }
  }

  private renderFill() {
    let { height } = this.props;
    const { orientation, color, width } = this.props;
    const center = this.thickness() / 2;
    const inset = circleRadius + 1;
    if (orientation === "horizontal") {
      return (
        <path
          d={`M${inset} ${center} l ${width - (inset * 2)} 0`}
          className="slider-line fill-line"
          stroke={color}
        />
      );
    } else {
      const totalHeight = height - (inset * 2);
      const top = inset + (totalHeight * (1 - this.sliderLocation()));
      height = totalHeight - top;
      if (height > 0) {
        return (
          <g>
            <path
              d={`M${center} ${top} l 0 ${height}`}
              className="slider-line fill-line"
              stroke={color}
            />
            <path
              d={`M${center} ${totalHeight} l 0 1`}
              className="slider-line fill-line cap"
              stroke={color}
            />
          </g>
        );
      }
    }
  }
}
