import * as React from "react";
const log = require("loglevel");

import { urlParams } from "../utils/url-params";
import { tr } from "../utils/translate";

const SliderWiggleLookback = 7;
const SliderWiggleThreshhold = 0.07;

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

interface Range {
  min: number;
  max: number;
}

interface SVGSliderViewProps {
  min: number;
  max: number;
  value: number;
  onValueChange?: (value: number) => void;
  onRangeChange?: (range: Range) => void;
  orientation: "horizontal" | "vertical";
  width: number;
  height: number;
  handleSize: number;
  renderValueTooltip: boolean;
  displayPrecision: number;
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
  nudge?: (delta: number) => void;
}

interface SVGSliderViewState {
  limit: number;
  grab: number;
  dragging: boolean;
  "editing-min": boolean;
  "editing-max": boolean;
  showButtons: boolean;
  deltaButtonDown: number;
}

export class SVGSliderView extends React.Component<SVGSliderViewProps, SVGSliderViewState> {

  public static displayName = "SVGSliderView";

  public state: SVGSliderViewState = {
    limit: 0,
    grab: 0,
    dragging: false,
    "editing-min": false,
    "editing-max": false,
    showButtons: false,
    deltaButtonDown: 0,
  };

  private slider: HTMLDivElement | null;
  private handle: HTMLDivElement | null;
  private buttonContainer: HTMLDivElement | null;
  private input: HTMLInputElement | null;

  private nudgeInterval: number | null = null;
  private sliderMoved: boolean;
  private wiggleList: number[] = [];

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
    window.removeEventListener("mousedown", this.handleCheckIfNeedToHideButtons, true);
    window.removeEventListener("touchstart", this.handleCheckIfNeedToHideButtons, true);
    return window.removeEventListener("resize", this.handleUpdate);
  }

  public componentDidUpdate(prevProps: SVGSliderViewProps, prevState: SVGSliderViewState) {
    const {showButtons} = this.state;
    if (showButtons !== prevState.showButtons) {
      if (showButtons) {
        window.addEventListener("mousedown", this.handleCheckIfNeedToHideButtons, true);
        window.addEventListener("touchstart", this.handleCheckIfNeedToHideButtons, true);
      } else {
        window.removeEventListener("mousedown", this.handleCheckIfNeedToHideButtons, true);
        window.removeEventListener("touchstart", this.handleCheckIfNeedToHideButtons, true);
      }
    }
  }

  public render() {
    const { orientation, width, height, filled, showHandle, showLabels } = this.props;
    const { showButtons } = this.state;
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
        {showHandle && showButtons ? this.renderButtons() : undefined}
      </div>
    );
  }

  private updateRange(property, value) {
    const range: Range = {
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
    if (this.slider && this.handle) {
      const { orientation } = this.props;
      let { dimension } = constants.orientation[orientation];
      dimension = dimension.charAt(0).toUpperCase() + dimension.substr(1);
      const sliderPos = this.slider[`offset${dimension}`];
      const handlePos = this.handle[`offset${dimension}`];

      return this.setState({
        limit: sliderPos - handlePos,
        grab: handlePos / 2
      });
    }
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
    const style: any = {bottom: `${this.props.handleSize}px`}; // checked: any ok

    if (this.state.dragging && this.props.renderValueTooltip) {
      style.display = "block";
    }
    return <div className="number" style={style}>{this.props.value.toFixed(this.props.displayPrecision)}</div>;
  }

  private isButtonEvent(e) {
    const {target} = e;
    const {parentNode} = target;
    return (target.getAttribute("class") === "slider-button") || (parentNode && (parentNode.getAttribute("class") === "slider-button"));
  }

  private handleNoop = (e) => {
    e.stopPropagation();
    e.preventDefault();
  }

  private handleClick = (e) => {
    if (this.isButtonEvent(e)) {
      return;
    }
    this.handleNoop(e);
    if (!this.sliderMoved) {
      this.toggleButtons();
    }
    this.sliderMoved = false;
    this.wiggleList = [];
  }

  private handleStart = (e) => {
    if (this.isButtonEvent(e)) {
      return;
    }
    this.handleNoop(e);
    if (this.props.onSliderDragStart) {
      this.props.onSliderDragStart();
    }
    document.addEventListener("mousemove", this.handleDrag, true);
    document.addEventListener("touchmove", this.handleDrag, true);
    document.addEventListener("mouseup",   this.handleEnd, true);
    document.addEventListener("touchend",  this.handleEnd, true);
  }

  private handleEnd = (e) => {
    if (this.isButtonEvent(e)) {
      return;
    }
    if (this.props.onSliderDragEnd) {
      this.props.onSliderDragEnd();
    }
    document.removeEventListener("mousemove", this.handleDrag, true);
    document.removeEventListener("touchmove", this.handleDrag, true);
    document.removeEventListener("mouseup",   this.handleEnd, true);
    document.removeEventListener("touchend",  this.handleEnd, true);
  }

  private handleDrag = (e) => {
    if (this.isButtonEvent(e)) {
      return;
    }
    this.handleNoop(e);
    this.sliderMoved = true;
    const { onValueChange } = this.props;
    if (onValueChange == null) { return; }

    const value = this.position(e);
    if (value !== this.props.value) {
      this.checkForSliderWiggle(value);
      return onValueChange(value);
    }
  }

  private handleJumpAndDrag = (e) => {
    if (this.isButtonEvent(e)) {
      return;
    }
    this.handleDrag(e);
    return this.handleStart(e);
  }

  // shows the buttons if the user moves the slider around a small range
  private checkForSliderWiggle(value: number) {
    if (this.state.showButtons) {
      return;
    }
    const {wiggleList} = this;
    const newestIndex = wiggleList.length - 1;
    if ((newestIndex >= 0) && (wiggleList[newestIndex] === value)) {
      return;
    }
    wiggleList.push(value);
    if (wiggleList.length > SliderWiggleLookback) {
      const maxChange = (this.props.max - this.props.min) * SliderWiggleThreshhold;
      const oldestIndex = newestIndex - SliderWiggleLookback;
      const oldestValue = wiggleList[oldestIndex];
      let maxAbsDelta = 0;
      for (let i = oldestIndex + 1; i <= newestIndex; i++) {
        maxAbsDelta = Math.max(maxAbsDelta, Math.abs(wiggleList[i] - oldestValue));
      }
      if (maxAbsDelta <= maxChange) {
        /*
        // keep for debugging later
        console.log("checkForSliderWiggle - showing button!", {
          maxAbsDelta,
          maxChange,
          oldestIndex,
          newestIndex,
          oldestValue,
          testedList: wiggleList.slice(oldestIndex),
          fullList: wiggleList,
        });
        */
        this.setState({showButtons: true});
      }
    }
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
    if (this.slider) {
      const { grab } = this.state;
      const { orientation } = this.props;
      const coordinateStyle = constants.orientation[orientation].coordinate;
      const directionStyle = constants.orientation[orientation].direction;
      const clientCoordinateStyle = `client${coordinateStyle.toUpperCase()}`;
      const coordinate = !e.touches ? e[clientCoordinateStyle] : e.touches[0][clientCoordinateStyle];
      const rect = this.slider && this.slider.getBoundingClientRect();
      if (rect && rect[directionStyle]) {
        const direction = rect[directionStyle];
        const pos = coordinate - direction - grab;
        const value = this.getValueFromPosition(pos);
        return value;
      }
    }
    return 0;
  }

  private renderHandle() {
    let height;
    const { orientation, handleSize, displaySemiQuant } = this.props;
    const width = (height = `${handleSize}px`);
    const centerOfDiv = `${this.sliderPercent()}%`;
    const outerEdge = Math.round((this.thickness() - handleSize) / 2.0 );
    const style: any = { // checked: any valid
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
        onTouchStart={this.handleStart}
        onClick={this.handleClick}
      >
        <i className={classNames} />
        {label}
      </div>
    );
  }

  private renderEditableProperty(property: "min" | "max") {
    const isEditable = this.props[`${property}Editable`];
    const key = `editing-${property}`;

    const handleSwapState = () => {
      // if not editable, ignore
      if (!isEditable) { return; }
      // first copy state value to model if we were editing
      if (this.state[key] && this.input) {
        this.updateRange(property, parseFloat(this.input.value));
      }
      const toggleValue = !this.state[key];
      const focus = () => this.input ? this.input.focus() : undefined;
      if (property === "min") {
        this.setState({"editing-min": toggleValue}, focus);
      } else {
        this.setState({"editing-max": toggleValue}, focus);
      }
    };

    const handleKeyDown = (evt) => {
      if (evt.key === "Enter") {
        return handleSwapState();
      }
    };

    let classNames = property;
    if (isEditable) { classNames += " editable"; }

    if (!this.state[key]) {
      return <div className={classNames} onClick={handleSwapState}>{this.props[property]}</div>;
    } else {
      return (
        <input
          className={property}
          type="number"
          value={this.props[property]}
          onBlur={handleSwapState}
          onKeyDown={handleKeyDown}
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
    const ticks: JSX.Element[] = [];
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

  private toggleButtons() {
    this.setState({showButtons: !this.state.showButtons});
  }

  private renderButtons() {
    const { deltaButtonDown } = this.state;
    const {height, width} = this.props;
    const margin = 4;
    const buttonSize = 26;
    const svgHeight = margin + (buttonSize * 2);
    const upButtonStyle = {fill: (deltaButtonDown === 1 ? "#000" : "#FFF"), fillOpacity: 0.5, strokeWidth: 2, stroke: "#888"};
    const downButtonStyle = {fill: (deltaButtonDown === -1 ? "#000" : "#FFF"), fillOpacity: 0.5, strokeWidth: 2, stroke: "#888"};
    const arrowStyle =  {fill: "#FFF", fillOpacity: 0.5, strokeWidth: 1, stroke: "#888"};
    const buttonRadius = buttonSize * 0.25;
    const arrowSize = buttonSize / 2;
    const halfArrowSize = arrowSize / 2;
    const arrowMargin = buttonSize / 4;
    const marginTop = -(svgHeight - ((svgHeight - height) / 2));
    const marginLeft = -(buttonSize + width + margin);

    return (
      <div style={{marginTop, marginLeft}} ref={s => this.buttonContainer = s}>
        <svg className="slider-buttons" width={`${buttonSize}px`} height={`${svgHeight}px`} viewBox={`0 0 ${buttonSize} ${svgHeight}`}>
          <g className="slider-button" onMouseDown={this.handleNudgeUp} onTouchStart={this.handleNudgeUp} onTouchEnd={this.handleNoop}>
            <rect width={buttonSize} height={buttonSize} rx={buttonRadius} ry={buttonRadius} style={upButtonStyle}  />
            <path d={`M${arrowMargin} ${arrowSize + (arrowSize / 4)} l${halfArrowSize} -${halfArrowSize} l${halfArrowSize} ${halfArrowSize} Z`} style={arrowStyle} />
          </g>
          <g className="slider-button" onMouseDown={this.handleNudgeDown} onTouchStart={this.handleNudgeDown} onTouchEnd={this.handleNoop}>
            <rect y={buttonSize + margin} width={buttonSize} height={buttonSize} rx={buttonRadius} ry={buttonRadius} style={downButtonStyle} />
            <path d={`M${arrowMargin} ${buttonSize + margin + arrowSize - (arrowSize / 5)} l${halfArrowSize} ${halfArrowSize} l${halfArrowSize} -${halfArrowSize} Z`} style={arrowStyle} />
          </g>
        </svg>
      </div>
    );
  }

  private handleNudgeUp = (e: React.MouseEvent<SVGElement> | React.TouchEvent<SVGElement>) => {
    this.handleNoop(e);
    this.handleNudge(1);
  }

  private handleNudgeDown = (e: React.MouseEvent<SVGElement> | React.TouchEvent<SVGElement>) => {
    this.handleNoop(e);
    this.handleNudge(-1);
  }

  private handleNudge = (delta: number) => {
    const {min, max} = this.props;
    const maxNudge = (max - min) * 0.5;
    const startOfNudge = Date.now();
    const clearMouseDownInterval = () => {
      if (this.nudgeInterval) {
        window.clearInterval(this.nudgeInterval);
        this.nudgeInterval = null;
      }
    };
    const nudge = (value) => {
      if (this.props.nudge) {
        this.props.nudge(value);
      }
    };
    const mouseDownNudge = () => {
      const now = Date.now();
      // create an exponent for the modifer of number of seconds after 1 second from the start of the nudge
      const exp = Math.max(0, (now - startOfNudge - 1000) / 1000);
      // create modifier starting after 1 second (Math.pow(10, 0) is 1 which is why 1 is subtracted)
      const mod = Math.min(maxNudge, Math.pow(10, exp) - 1);
      nudge(delta + (delta * mod));
    };
    const mouseUp = (e: MouseEvent) => {
      clearMouseDownInterval();
      nudge(delta);
      document.removeEventListener("mouseup", mouseUp, true);
      document.removeEventListener("touchend", mouseUp, true);
      this.setState({deltaButtonDown: 0});
    };

    clearMouseDownInterval();
    this.nudgeInterval = window.setInterval(mouseDownNudge, 200);

    document.addEventListener("mouseup", mouseUp, true);
    document.addEventListener("touchend", mouseUp, true);
    this.setState({deltaButtonDown: delta});
  }

  private handleCheckIfNeedToHideButtons = (e: MouseEvent) => {
    const {showHandle} = this.props;
    const {showButtons} = this.state;
    if (showHandle && showButtons) {
      // if this comes in as a touch event prevent the mouse event from being generated
      e.preventDefault();
      e.stopPropagation();
      let target: HTMLElement | null = e.target as HTMLElement;
      while (target !== null) {
        if (target === this.buttonContainer) {
          // the event was inside the nudge buttons container so ignore it
          return;
        }
        target = target.parentElement;
      }
      // the event was outside the nudge buttons container so hide the buttons
      this.setState({showButtons: false});
    }
  }
}
