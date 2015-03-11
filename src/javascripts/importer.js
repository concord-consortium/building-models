function MySystemImporter(system) {
  this.system = system;
  
  this.importData = function(data) {
    var importNodes = data['nodes'];
    var importLinks = data['links'];
    this.importNodes(importNodes);
    this.importLinks(importLinks);
  };


  this.importNodes = function(importNodes) {
    var newNodes = [];
    var node = null;
    for (var index in importNodes) {
      data = importNodes[index];
      this.system.importNode({'key': data.key, 'data':data });
    }
  };

  this.importLinks = function(links) {
    var newLinks = [];
    var link = null;
    for (var key in links) {
      data = links[key];
      this.system.importLink({
        sourceNode: data.sourceNodeKey,
        targetNode: data.targetNodeKey,
        sourceTerminal: data.sourceTerminal,
        targetTerminal: data.targetTerminal,
        title: data.title,
        color: data.color
      });
    }
  };


}

module.exports = MySystemImporter;