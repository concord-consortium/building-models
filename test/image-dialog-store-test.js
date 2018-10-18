/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
global._      = require('lodash');
global.log    = require('loglevel');
global.Reflux = require('reflux');

global.window = { location: '' };

const chai = require('chai');
chai.config.includeStack = true;

const { expect }         = chai;
const should         = chai.should();
const Sinon          = require('sinon');

const ImageDialogStore = require("../src/code/stores/image-dialog-store");

describe('ImageDialogStore', function() {

  beforeEach(function() {
    this.clock = Sinon.useFakeTimers();
    return this.mock = Sinon.mock(ImageDialogStore.store);
  });

  afterEach(function() {
    this.clock.restore();
    return this.mock.restore();
  });

  it('GraphPrimitive should exists', () => ImageDialogStore.should.exist);

  return describe('the ImageDialogStore Actions', function() {
    beforeEach(function() {
      return this.actions = ImageDialogStore.actions;
    });

    return describe('open', function() {
      describe('with no callback', function() {
        beforeEach(function() {
          this.actions.open(false);
          return this.clock.tick(1);
        });

        it("should try to keep the dialog open", () => ImageDialogStore.store.keepShowing.should.equal(true));

        return it("shouldn't call 'close' when finishing", function() {
          this.mock.expects("close").never();
          this.actions.cancel();
          this.clock.tick(1);
          return this.mock.verify();
        });
      });


      return describe("when opened with a callback function", function() {
        beforeEach(function() {
          this.callbackF = Sinon.spy();
          this.actions.open(this.callbackF);
          return this.clock.tick(1);
        });

        it("shouldn't keep the dialog open", () => ImageDialogStore.store.keepShowing.should.equal(false));

        it("should call 'close' when finishing", function() {
          this.mock.expects("close");
          this.actions.cancel();
          this.clock.tick(1);
          return this.mock.verify();
        });

        return it("should call the callback when finishing", function() {
          this.actions.cancel();
          this.clock.tick(1);
          return this.callbackF.called.should.be.true;
        });
      });
    });
  });
});
