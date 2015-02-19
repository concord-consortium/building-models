function Importer(system) {
  this.system = system;
  this.importNodes = function(importNodes) {
    var newNodes = [];
    var node = null;
    for (var key in importNodes) {
      data = importNodes[key];
      this.system.addNode({'key': key, 'data':data });
    }
  };

  this.importLinks = function(links) {
    var newLinks = [];
    var link = null;
    for (var key in links) {
      data = links[key];
      this.system.addLink({'key': key, 'data':data });
    }
  };

  this.importData = function(mySystemFormat) {
    var importNodes = mySystemFormat['MySystem.Node'];
    var importLinks = mySystemFormat['MySystem.Link'];
    this.importNodes(importNodes);
    this.importLinks(importLinks);
  };
}

module.exports = Importer;