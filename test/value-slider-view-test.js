/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
global.React = require('react');

const chai = require('chai');
chai.config.includeStack = true;

const React = require('react');
const {div} = React.DOM;
const Enzyme = require('enzyme');

const { shallow, mount, render } = Enzyme;

const { expect }         = chai;

const requireView = name => require(`${__dirname}/../src/code/views/${name}`);

const Slider        = React.createFactory(requireView('value-slider-view'));

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