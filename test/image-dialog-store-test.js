global._      = require 'lodash'
global.log    = require 'loglevel'
global.Reflux = require 'reflux'

global.window = { location: '' }

chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

ImageDialogStore = require "../src/code/stores/image-dialog-store"

describe 'ImageDialogStore', ->

  beforeEach ->
    @clock = Sinon.useFakeTimers()
    @mock = Sinon.mock(ImageDialogStore.store)

  afterEach ->
    @clock.restore()
    @mock.restore()

  it 'GraphPrimitive should exists', ->
    ImageDialogStore.should.exist

  describe 'the ImageDialogStore Actions', ->
    beforeEach ->
      @actions = ImageDialogStore.actions

    describe 'open', ->
      describe 'with no callback', ->
        beforeEach ->
          @actions.open false
          @clock.tick(1)

        it "should try to keep the dialog open", ->
          ImageDialogStore.store.keepShowing.should.equal true

        it "shouldn't call 'close' when finishing", ->
          @mock.expects("close").never()
          @actions.cancel()
          @clock.tick 1
          @mock.verify()


      describe "when opened with a callback function", ->
        beforeEach ->
          @callbackF = Sinon.spy()
          @actions.open @callbackF
          @clock.tick 1

        it "shouldn't keep the dialog open", ->
          ImageDialogStore.store.keepShowing.should.equal false

        it "should call 'close' when finishing", ->
          @mock.expects "close"
          @actions.cancel()
          @clock.tick 1
          @mock.verify()

        it "should call the callback when finishing", ->
          @actions.cancel()
          @clock.tick 1
          @callbackF.called.should.be.true
