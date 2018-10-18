global.React = require 'react'

chai = require('chai')
chai.config.includeStack = true

React = require('react')
{div} = React.DOM
Enzyme = require 'enzyme'

{ shallow, mount, render } = Enzyme

expect         = chai.expect

requireView = (name) -> require "#{__dirname}/../src/code/views/#{name}"

Slider        = React.createFactory(requireView 'value-slider-view')

describe "The Value Slider", ->
  it "contains a div with the value-slider class", ->
    wrapper = shallow(Slider({}))
    expect(wrapper.find('.value-slider').length).to.equal(1)
  describe "vertical slider", ->
    it "has a vertical classs ", ->
      component = shallow(Slider({'orientation': 'vertical'}))
      expect(component.hasClass('vertical')).to.equal(true)
  describe "horizontal slider", ->
    it "doesn't have the horizontal classs ", ->
      component = shallow(Slider({'orientation': 'horizontal'}))
      expect(component.hasClass('vertical')).to.equal(false)