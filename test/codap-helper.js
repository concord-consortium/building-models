/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
global.window = { location: '' };
global._      = require('lodash');
global.log    = require('loglevel');
global.Reflux = require('reflux');

const Sinon          = require('sinon');
const requireModel = name => require(`${__dirname}/../src/code/models/${name}`);
const CodapConnect = requireModel('codap-connect');

module.exports = {
  Stub() {
    this.sandbox = Sinon.sandbox.create();
    return this.sandbox.stub(CodapConnect, "instance", () =>
      ({
        sendUndoableActionPerformed() { return ''; },
        _createMissingDataAttributes() { return ''; }
      })
    );
  },
  UnStub() {
     return CodapConnect.instance.restore();
   }
};
