
import * as React from "react";

chai.config.includeStack = true;

const Enzyme = require("enzyme");
const { shallow } = Enzyme;

const { expect } = chai;

import { SVGSliderView as SVGSliderViewClass } from "../src/code/views/value-slider-view";
const Slider = React.createFactory(SVGSliderViewClass);

describe("The Value Slider", () => {
  const createSlider = (orientation: string) => {
    return Slider({
      orientation,
      filled: true,
      height: 44,
      width: 15,
      showHandle: null,
      showLabels: false,
      onValueChange: null,
      value: 50,
      displaySemiQuant: false,
      max: 100,
      min: 1,
      onSliderDragStart: null,
      onSliderDragEnd: null,
      color: "#f00",
      handleSize: 16,
      stepSize: 1,
      showTicks: false,
      displayPrecision: 0,
      renderValueTooltip: true,
      minLabel: null,
      maxLabel: null
    });
  };

  it("contains a div with the value-slider class", () => {
    const wrapper = shallow(createSlider(""));
    return expect(wrapper.find(".value-slider").length).to.equal(1);
  });
  describe("vertical slider", () =>
    it("has a vertical classs ", () => {
      const component = shallow(createSlider("vertical"));
      return expect(component.hasClass("vertical")).to.equal(true);
    })
  );
  return describe("horizontal slider", () =>
    it("doesn't have the horizontal classs ", () => {
      const component = shallow(createSlider("horizontal"));
      return expect(component.hasClass("vertical")).to.equal(false);
    })
  );
});

