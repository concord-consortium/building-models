(function() {
  var LinkManager, _, log;

  _ = require('lodash');

  log = require('loglevel');

  LinkManager = (function() {
    function LinkManager() {
      this.linkKeys = {};
    }

    LinkManager.prototype.hasLink = function(link) {
      return this.linkKeys[link.terminalKey()] != null;
    };

    LinkManager.prototype.addLink = function(link) {
      if (!this.hasLink(link)) {
        this.linkKeys[link.terminalKey()] = link;
        return true;
      }
      return false;
    };

    return LinkManager;

  })();

  module.exports = LinkManager;

}).call(this);
