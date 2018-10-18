/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

let {div, i, label, span, input, svg, circle, path, rect, g} = React.DOM;
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

const ValueSlider = React.createClass({
  displayName: "SVGSlider",

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

  getInitialState() {
    return {
      limit: 0,
      grab: 0,
      dragging: false,
      "editing-min": false,
      "editing-max": false
    };
  },

  updateRange(property, value) {
    const range = {
      min: this.props.min,
      max: this.props.max
    };
    range[property] = value;

    //normalize
    if (property === "max") {
      range.min = Math.min(range.min, range.max);
    } else {
      range.max = Math.max(range.min, range.max);
    }
    if ((this.props.value < range.min) || (this.props.value > range.max)) {
      value = Math.max(range.min, Math.min(range.max, this.props.value));
      this.props.onValueChange(value);
    }
    return this.props.onRangeChange(range);
  },

  componentDidMount() {
    window.addEventListener("resize", this.handleUpdate);
    return this.handleUpdate();
  },

  componentWillUnmount() {
    return window.removeEventListener("resize", this.handleUpdate);
  },

  handleUpdate() {
    const { orientation } = this.props;
    let { dimension } = constants.orientation[orientation];
    dimension = dimension.charAt(0).toUpperCase() + dimension.substr(1);
    const sliderPos = this.slider[`offset${dimension}`];
    const handlePos = (this.handle != null ? this.handle[`offset${dimension}`] : undefined) || 0;

    return this.setState({
      limit: sliderPos - handlePos,
      grab: handlePos / 2
    });
  },

  sliderLocation() {
    return this.clamp((this.props.value - this.props.min) / (this.props.max - this.props.min), 0, 1);
  },

  sliderPercent() {
    const p = this.sliderLocation() * 100;
    if (this.props.orientation === "horizontal") {
      return p;
    } else {
      return 100 - p;
    }
  },

  thickness() {
    if (this.props.orientation === "horizontal") { return this.props.height; } else { return this.props.width; }
  },
  length() {
    if (this.props.orientation === "horizontal") { return this.props.width; } else { return this.props.height; }
  },

  renderNumber() {
    const style: any =
      {bottom: `${this.props.handleSize}px`};

    if (this.state.dragging && this.props.renderValueTooltip) {
      style.display = "block";
    }
    return (div({className: "number", style}, this.props.value.toFixed(this.props.displayPrecision)));
  },

  handleNoop(e) {
    e.stopPropagation();
    return e.preventDefault();
  },

  handleStart(e) {
    this.handleNoop(e);
    if (typeof this.props.onSliderDragStart === "function") {
      this.props.onSliderDragStart();
    }
    document.addEventListener("mousemove", this.handleDrag);
    return document.addEventListener("mouseup",   this.handleEnd);
  },

  handleEnd() {
    if (typeof this.props.onSliderDragEnd === "function") {
      this.props.onSliderDragEnd();
    }
    document.removeEventListener("mousemove", this.handleDrag);
    return document.removeEventListener("mouseup",   this.handleEnd);
  },

  handleDrag(e) {
    this.handleNoop(e);
    const { onValueChange } = this.props;
    if (onValueChange == null) { return; }

    const value = this.position(e);
    if (value !== this.props.value) {
      return onValueChange(value);
    }
  },

  handleJumpAndDrag(e) {
    this.handleDrag(e);
    return this.handleStart(e);
  },

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  getValueFromPosition(pos) {
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
  },

  position(e) {
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
  },

  renderHandle() {
    let height;
    const { orientation, handleSize, displaySemiQuant } = this.props;
    const width = (height = `${handleSize}px`);
    const centerOfDiv = `${this.sliderPercent()}%`;
    const outerEdge = Math.round((this.thickness() - handleSize)/ 2.0 );
    const style: any = {
      "width": width,
      "height": height,
      "fontSize": `${handleSize / 2}px`
    };

    if (orientation === "horizontal") {
      style.top  = `${outerEdge}px`;
      style.left = centerOfDiv; // margin will take care of the rest?
      style.marginLeft = `-${handleSize/2}px`;
      style.marginRight = `-${handleSize/2}px`;
    } else {
      style.left  = `${outerEdge}px`;
      style.top = centerOfDiv;
      style.marginTop = `-${handleSize/2}px`;
      style.marginBottom = `-${handleSize/2}px`;
    }

    if (!displaySemiQuant) {
      label = this.renderNumber();
    } else { label = null; }

    let classNames = "icon-codap-smallSliderLines";
    if (orientation !== "horizontal") { classNames += " rotated"; }

    return (div({
      className: "value-slider-handle",
      style,
      ref: s => { return this.handle = s; },
      onMouseDown: this.handleStart,
      onTouchEnd: this.handleNoop,
      onTouchMove: this.handleDrag
    },

    (i({className: classNames})),
    ( label )
    ));
  },

  renderEditableProperty(property) {
    const isEditable = this.props[`${property}Editable`];

    const swapState = () => {
      // if not editable, ignore
      if (!isEditable) { return; }
      // first copy state value to model if we were editing
      if (this.state[`editing-${property}`]) {
        const newValue = parseInt(__guard__(ReactDOM.findDOMNode(this.refs.focusable), x => x.value));
        if (newValue != null) { this.updateRange(property, newValue); }
      }
      return this.setState({[`editing-${property}`]: !this.state[`editing-${property}`]}, function() {
        return (this.refs.focusable != null ? this.refs.focusable.focus() : undefined);
      });
    };

    const keyDown = function(evt) {
      if (evt.key === "Enter") {
        return swapState();
      }
    };

    let classNames = property;
    if (isEditable) { classNames += " editable"; }

    if (!this.state[`editing-${property}`]) {
      return (div({className: classNames, onClick: swapState}, this.props[property]));
    } else {
      return (input({
        className: property,
        type: "number",
        value: this.props[property],
        onBlur: swapState,
        onKeyDown: keyDown,
        ref: "focusable"})
      );
    }
  },

  renderLegend() {
    const { minLabel, maxLabel, displaySemiQuant, orientation, width } = this.props;

    const min = minLabel ||
      (displaySemiQuant ? tr("~NODE-VALUE-EDIT.LOW") : this.renderEditableProperty("min"));
    const max = maxLabel ||
      (displaySemiQuant ? tr("~NODE-VALUE-EDIT.HIGH") : this.renderEditableProperty("max"));

    if (orientation === "horizontal") {
      return (div({className:"legend"},
        min, max
      ));
    } else {
      return (div({className:"legend", style: {left: width/1.7}},
        max, min
      ));
    }
  },

  renderTicks() {
    const { showTicks, max, min, stepSize, orientation } = this.props;
    if (!showTicks) { return; }

    const center = this.thickness() / 2;
    const numTicks = ((max - min) / stepSize);
    const tickDistance = this.length() / numTicks;
    const tickHeight = circleRadius * 1.5;
    const ticks: any[] = [];
    for (let j = 1, end = numTicks, asc = 1 <= end; asc ? j < end : j > end; asc ? j++ : j--) {
      if (orientation === "horizontal") {
        ticks.push((path({key: j, d:`M${j*tickDistance} ${center-tickHeight} l 0 ${tickHeight * 2}`, className:"slider-line"})));
      } else {
        ticks.push((path({key: j, d:`M${center-tickHeight} ${j*tickDistance} l ${tickHeight * 2} 0`, className:"slider-line"})));
      }
    }
    return ticks;
  },

  renderLine() {
    let filled, height, orientation, width;
    ({ filled, orientation, width, height } = this.props);
    const center = this.thickness() / 2;
    let inset = circleRadius;
    if (filled) { inset += 1; }
    if (orientation === "horizontal") {
      return (g({},
        (path({d:`M${inset} ${center} l ${width - (inset*2)} 0`, className:"slider-line", stroke:"#ccc"})),
        !filled ?
          (g({},
            (circle({cx:circleRadius, cy:center, r:circleRadius, className:"slider-shape", stroke:"#ccc"})),
            (circle({cx:width - circleRadius, cy:center, r:circleRadius, className:"slider-shape"}))
          )) : undefined,
        this.renderTicks()
      ));
    } else {
      return (g({},
        (path({d:`M${center} ${inset} l 0 ${height - (inset*2)}`, className:"slider-line", stroke:"#ccc"})),
        !filled ?
          (g({},
            (circle({cx:center, cy:circleRadius, r:circleRadius, className:"slider-shape", stroke:"#ccc"})),
            (circle({cx:center, cy:height - circleRadius, r:circleRadius, className:"slider-shape"}))
          )) : undefined,
        this.renderTicks()
      ));
    }
  },

  renderFill() {
    let { orientation, color, width, height } = this.props;
    const center = this.thickness() / 2;
    const inset = circleRadius + 1;
    if (orientation === "horizontal") {
      return (path({
        d: `M${inset} ${center} l ${width - (inset*2)} 0`,
        className: "slider-line fill-line",
        stroke: color
      }));
    } else {
      const totalHeight = height - (inset * 2);
      const top = inset + (totalHeight * (1 - this.sliderLocation()));
      height = totalHeight-top;
      if (height > 0) {
        return (g({},
          (path({ // flat top
            d: `M${center} ${top} l 0 ${height}`,
            className: "slider-line fill-line",
            stroke: color
          })),
          (path({ // rounded bottom
            d: `M${center} ${totalHeight} l 0 1`,
            className: "slider-line fill-line cap",
            stroke: color
          }))
        ));
      }
    }
  },

  render() {
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
    return (div({
      className: classNames,
      style,
      ref: s => { return this.slider = s; },
      onMouseDown: showHandle ? this.handleJumpAndDrag : this.handleNoop,
      onTouchStart: showHandle ? this.handleJumpAndDrag : this.handleNoop,
      onTouchEnd: this.handleNoop
    },
    (svg({className: "svg-background", width: `${width}px`, height:`${height}px`, viewBox: `0 0 ${width} ${height}`},
      this.renderLine(),
      filled ?
        this.renderFill() : undefined
    )),
    showHandle ?
      this.renderHandle() : undefined,
    showLabels ?
      this.renderLegend() : undefined
    ));
  }
});

module.exports = ValueSlider;
const Slider = React.createFactory(ValueSlider);
const Demo = React.createClass({
  getInitialState() {
    return {
      value: 50,
      min: 0,
      max: 100
    };
  },
  onValueChange(v) {
    return this.setState({value: v});
  },
  onRangeChange(range) {
    return this.setState({
      min: range.min,
      max: range.max
    });
  },
  render() {
    return (div({style: {display: "flex"}},
      (div({},
        Slider({
          value: this.state.value,
          min: this.state.min,
          max: this.state.max,
          stepSize: 25,
          showTicks: true,
          snapToSteps: true,
          minEditable: true,
          maxEditable: true,
          onValueChange: this.onValueChange,
          onRangeChange: this.onRangeChange
        }),

        Slider({
          orientation: "vertical",
          height:  72,
          width: 20,
          value: this.state.value,
          min: this.state.min,
          max: this.state.max,
          stepSize: 25,
          showTicks: true,
          snapToSteps: true,
          minEditable: true,
          maxEditable: true,
          onValueChange: this.onValueChange,
          onRangeChange: this.onRangeChange})
      )),
      (div({},
        Slider({
          orientation: "vertical",
          filled: true,
          showLabels: false,
          showHandle: true,
          renderValueTooltip: false,
          height:  72,
          width: 20,
          value: this.state.value,
          min: this.state.min,
          max: this.state.max,
          stepSize: 1,
          minEditable: true,
          maxEditable: true,
          onValueChange: this.onValueChange,
          onRangeChange: this.onRangeChange})
      )),
      (div({},
        Slider({
          orientation: "vertical",
          filled: true,
          showLabels: false,
          showHandle: false,
          height:  72,
          width: 20,
          value: this.state.value,
          min: this.state.min,
          max: this.state.max,
          stepSize: 1,
          minEditable: true,
          maxEditable: true,
          onValueChange: this.onValueChange,
          onRangeChange: this.onRangeChange})
      ))
    ));
  }
});

(window as any).testComponent = domID => ReactDOM.render(React.createElement(Demo,{}), domID);

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}