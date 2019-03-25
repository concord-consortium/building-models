import * as React from "react";

import * as chai from "chai";
chai.config.includeStack = true;

const Enzyme = require("enzyme");
const { shallow, configure } = Enzyme;

const Adapter = require("enzyme-adapter-react-16");
configure({ adapter: new Adapter() });

const { expect } = chai;

import { SVGSliderView as SVGSliderViewClass } from "../src/code/views/value-slider-view";
const Slider = React.createFactory(SVGSliderViewClass);

const savedAddEventListener = window.addEventListener;

describe("The Value Slider", () => {
  const createSlider = (orientation: "horizontal" | "vertical") => {
    return Slider({
      orientation,
      filled: true,
      height: 44,
      width: 15,
      showHandle: false,
      showLabels: false,
      onValueChange: (value) => undefined,
      value: 50,
      displaySemiQuant: false,
      max: 100,
      min: 1,
      onSliderDragStart: () => undefined,
      onSliderDragEnd: () => undefined,
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

  // fake the event listeners for enzyme
  before(() => {
    window.addEventListener = () => undefined;
  });
  after(() => {
    window.addEventListener = savedAddEventListener;
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

