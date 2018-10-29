
import * as React from "react";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const chai = require('chai');
chai.config.includeStack = true;

const {div} = React.DOM;
const Enzyme = require('enzyme');

const { shallow, mount, render } = Enzyme;

const { expect }         = chai;

import { SVGSliderView as SVGSliderViewClass } from "../src/code/views/value-slider-view";
const Slider = React.createFactory(SVGSliderViewClass);

describe("The Value Slider", function() {
  it("contains a div with the value-slider class", function() {
    const wrapper = shallow(Slider({}));
    return expect(wrapper.find('.value-slider').length).to.equal(1);
  });
  describe("vertical slider", () =>
    it("has a vertical classs ", function() {
      const component = shallow(Slider({'orientation': 'vertical'}));
      return expect(component.hasClass('vertical')).to.equal(true);
    })
  );
  return describe("horizontal slider", () =>
    it("doesn't have the horizontal classs ", function() {
      const component = shallow(Slider({'orientation': 'horizontal'}));
      return expect(component.hasClass('vertical')).to.equal(false);
    })
  );
});