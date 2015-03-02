function Importer(system) {
  this.system = system;
  this.importNodes = function(importNodes) {
    var newNodes = [];
    var node = null;
    for (var key in importNodes) {
      data = importNodes[key];
      this.system.importNode({'key': key, 'data':data });
    }
  };

  this.importLinks = function(links) {
    var newLinks = [];
    var link = null;
    for (var key in links) {
      data = links[key];
      this.system.importLink({
        sourceNode: data.startNode,
        targetNode: data.endNode,
        sourceTerminal: data.startTerminal,
        targetTerminal: data.endTerminal,
        title: data.text,
        color: data.color
      });
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