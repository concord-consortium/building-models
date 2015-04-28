(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var AppView, LinkManager, getParameterByName;

AppView = React.createFactory(require('./views/app-view'));

LinkManager = require('./models/link-manager');

getParameterByName = function(name) {
  var regex, results;
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  regex = new RegExp("[#&]" + name + "=([^&]*)");
  results = regex.exec(location.hash);
  if (results === null) {
    return "";
  } else {
    return decodeURIComponent(results[1].replace(/\+/g, ' '));
  }
};

window.initApp = function(wireframes) {
  var appView, elem, opts;
  if (wireframes == null) {
    wireframes = false;
  }
  opts = {
    url: 'json/serialized.json',
    linkManager: LinkManager.instance('building-models'),
    data: getParameterByName('data')
  };
  appView = AppView(opts);
  elem = '#app';
  return jsPlumb.bind('ready', function() {
    return React.render(appView, $(elem)[0]);
  });
};



},{"./models/link-manager":5,"./views/app-view":15}],2:[function(require,module,exports){
module.exports = {
  getInitialAppViewState: function(subState) {
    var mixinState;
    mixinState = {
      selectedNode: null,
      selectedConnection: null,
      protoNodes: require('../views/proto-nodes'),
      filename: null
    };
    return _.extend(mixinState, subState);
  },
  componentDidUpdate: function() {
    return log.info('Did Update: AppView');
  },
  addDeleteKeyHandler: function(add) {
    var deleteFunction;
    if (add) {
      deleteFunction = this.props.linkManager.deleteSelected.bind(this.props.linkManager);
      return $(window).on('keydown', function(e) {
        if (e.which === 8 && !$(e.target).is('input, textarea')) {
          e.preventDefault();
          return deleteFunction();
        }
      });
    } else {
      return $(window).off('keydown');
    }
  },
  addToPalette: function(node) {
    var protoNodes;
    if (node != null ? node.image.match(/^(https?|data):/) : void 0) {
      if (!_.find(this.state.protoNodes, {
        image: node.image
      })) {
        protoNodes = this.state.protoNodes.slice(0);
        protoNodes.push({
          title: node.title || '',
          image: node.image
        });
        return this.setState({
          protoNodes: protoNodes
        });
      }
    }
  },
  componentDidMount: function() {
    var ref;
    this.addDeleteKeyHandler(true);
    this.props.linkManager.addSelectionListener((function(_this) {
      return function(selections) {
        _this.setState({
          selectedNode: selections.node,
          selectedConnection: selections.connection
        });
        _this.addToPalette(selections.node);
        return log.info('updated selections: + selections');
      };
    })(this));
    this.props.linkManager.addLoadListener((function(_this) {
      return function(data) {
        var i, len, node, ref, results;
        if (data.palette) {
          return _this.setState({
            protoNodes: data.palette
          });
        } else {
          _this.setState({
            protoNodes: require('../views/proto-nodes')
          });
          ref = data.nodes;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            node = ref[i];
            results.push(_this.addToPalette(node));
          }
          return results;
        }
      };
    })(this));
    this.props.linkManager.addFilenameListener((function(_this) {
      return function(filename) {
        return _this.setState({
          filename: filename
        });
      };
    })(this));
    if (((ref = this.props.data) != null ? ref.length : void 0) > 0) {
      return this.props.linkManager.loadData(JSON.parse(this.props.data));
    } else {
      return this.props.linkManager.loadDataFromUrl(this.props.url);
    }
  },
  componentDidUnmount: function() {
    return this.addDeleteKeyHandler(false);
  },
  getData: function() {
    return this.props.linkManager.toJsonString(this.state.protoNodes);
  },
  onNodeChanged: function(node, title, image) {
    return this.props.linkManager.changeNode(title, image);
  },
  onLinkChanged: function(link, title, color, deleted) {
    return this.props.linkManager.changeLink(title, color, deleted);
  }
};



},{"../views/proto-nodes":31}],3:[function(require,module,exports){
var GoogleDriveIO;

GoogleDriveIO = require('../utils/google-drive-io');

module.exports = {
  getInitialAppViewState: function(subState) {
    var mixinState;
    mixinState = {
      gapiLoaded: false,
      fileId: null,
      action: 'Checking authorization...'
    };
    return _.extend(mixinState, subState);
  },
  createGoogleDrive: function() {
    var waitForAuthCheck;
    this.googleDrive = new GoogleDriveIO();
    waitForAuthCheck = (function(_this) {
      return function() {
        var ref;
        if (typeof gapi !== "undefined" && gapi !== null ? (ref = gapi.auth) != null ? ref.authorize : void 0 : void 0) {
          return _this.googleDrive.authorize(true, function() {
            return _this.setState({
              gapiLoaded: true,
              action: null
            });
          });
        } else {
          return setTimeout(waitForAuthCheck, 10);
        }
      };
    })(this);
    return waitForAuthCheck();
  },
  newFile: function() {
    if (confirm('Are you sure?')) {
      this.props.linkManager.deleteAll();
      return this.setState({
        fileId: null
      });
    }
  },
  openFile: function() {
    return this.googleDrive.filePicker((function(_this) {
      return function(err, fileSpec) {
        if (err) {
          return alert(err);
        } else if (fileSpec) {
          _this.setState({
            action: 'Downloading...'
          });
          return _this.googleDrive.download(fileSpec, function(err, data) {
            if (err) {
              alert(err);
              return _this.setState({
                action: null
              });
            } else {
              _this.setState({
                fileId: fileSpec.id,
                action: null
              });
              _this.props.linkManager.deleteAll();
              return _this.props.linkManager.loadData(data);
            }
          });
        }
      };
    })(this));
  },
  rename: function() {
    var filename;
    filename = $.trim((prompt('Filename', this.props.filename)) || '');
    if (filename.length > 0) {
      this.props.linkManager.setFilename(filename);
    }
    return filename;
  },
  saveFile: function() {
    var fileId, filename;
    filename = this.rename();
    if (filename.length > 0) {
      this.setState({
        action: 'Uploading...'
      });
      fileId = filename === this.props.filename ? this.state.fileId : null;
      return this.googleDrive.upload({
        fileName: filename,
        fileId: fileId
      }, this.props.getData(), (function(_this) {
        return function(err, fileSpec) {
          if (err) {
            alert(err);
            return _this.setState({
              action: null
            });
          } else {
            return _this.setState({
              fileId: fileSpec.id,
              action: null
            });
          }
        };
      })(this));
    }
  }
};



},{"../utils/google-drive-io":9}],4:[function(require,module,exports){
var GraphPrimitive;

module.exports = GraphPrimitive = (function() {
  GraphPrimitive.counters = {};

  GraphPrimitive.reset_counters = function() {
    return GraphPrimitive.counters = {};
  };

  GraphPrimitive.nextID = function(type) {
    if (!GraphPrimitive.counters[type]) {
      GraphPrimitive.counters[type] = 0;
    }
    GraphPrimitive.counters[type]++;
    return type + "-" + GraphPrimitive.counters[type];
  };

  GraphPrimitive.prototype.type = 'GraphPrimitive';

  function GraphPrimitive() {
    this.id = GraphPrimitive.nextID(this.type);
    this.key = this.id;
  }

  return GraphPrimitive;

})();



},{}],5:[function(require,module,exports){
var DiagramNode, Importer, Link, LinkManager,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Importer = require('../utils/importer');

Link = require('./link');

DiagramNode = require('./node');

module.exports = LinkManager = (function() {
  LinkManager.instances = {};

  LinkManager.instance = function(context) {
    var base;
    if ((base = LinkManager.instances)[context] == null) {
      base[context] = new LinkManager(context);
    }
    return LinkManager.instances[context];
  };

  function LinkManager(context) {
    this.loadDataFromUrl = bind(this.loadDataFromUrl, this);
    this.linkKeys = {};
    this.nodeKeys = {};
    this.linkListeners = [];
    this.nodeListeners = [];
    this.selectionListeners = [];
    this.loadListeners = [];
    this.filename = null;
    this.filenameListeners = [];
    this.selectedNode = {};
  }

  LinkManager.prototype.addLinkListener = function(listener) {
    log.info("adding link listener");
    return this.linkListeners.push(listener);
  };

  LinkManager.prototype.addNodeListener = function(listener) {
    log.info("adding node listener");
    return this.nodeListeners.push(listener);
  };

  LinkManager.prototype.addSelectionListener = function(listener) {
    log.info("adding selection listener " + listener);
    return this.selectionListeners.push(listener);
  };

  LinkManager.prototype.addLoadListener = function(listener) {
    log.info("adding load listener " + listener);
    return this.loadListeners.push(listener);
  };

  LinkManager.prototype.addFilenameListener = function(listener) {
    log.info("adding filename listener " + listener);
    return this.filenameListeners.push(listener);
  };

  LinkManager.prototype.setFilename = function(filename) {
    var i, len, listener, ref, results;
    this.filename = filename;
    ref = this.filenameListeners;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      listener = ref[i];
      results.push(listener(filename));
    }
    return results;
  };

  LinkManager.prototype.getLinks = function() {
    var key, ref, results, value;
    ref = this.linkKeys;
    results = [];
    for (key in ref) {
      value = ref[key];
      results.push(value);
    }
    return results;
  };

  LinkManager.prototype.getNodes = function() {
    var key, ref, results, value;
    ref = this.nodeKeys;
    results = [];
    for (key in ref) {
      value = ref[key];
      results.push(value);
    }
    return results;
  };

  LinkManager.prototype.hasLink = function(link) {
    return this.linkKeys[link.terminalKey()] != null;
  };

  LinkManager.prototype.hasNode = function(node) {
    return this.nodeKeys[node.key] != null;
  };

  LinkManager.prototype.importLink = function(linkSpec) {
    var link, sourceNode, targetNode;
    sourceNode = this.nodeKeys[linkSpec.sourceNode];
    targetNode = this.nodeKeys[linkSpec.targetNode];
    linkSpec.sourceNode = sourceNode;
    linkSpec.targetNode = targetNode;
    link = new Link(linkSpec);
    return this.addLink(link);
  };

  LinkManager.prototype.addLink = function(link) {
    var i, len, listener, ref;
    if (!this.hasLink(link)) {
      this.linkKeys[link.terminalKey()] = link;
      this.nodeKeys[link.sourceNode.key].addLink(link);
      this.nodeKeys[link.targetNode.key].addLink(link);
      ref = this.linkListeners;
      for (i = 0, len = ref.length; i < len; i++) {
        listener = ref[i];
        log.info("notifying of new link: " + (link.terminalKey()));
        listener.handleLinkAdd(link);
      }
      this.selectLink(link);
      return true;
    }
    return false;
  };

  LinkManager.prototype.importNode = function(nodeSpec) {
    var node;
    node = new DiagramNode(nodeSpec.data, nodeSpec.key);
    return this.addNode(node);
  };

  LinkManager.prototype.addNode = function(node) {
    var i, len, listener, ref;
    if (!this.hasNode(node)) {
      this.nodeKeys[node.key] = node;
      ref = this.nodeListeners;
      for (i = 0, len = ref.length; i < len; i++) {
        listener = ref[i];
        log.info("notifying of new Node");
        listener.handleNodeAdd(node);
      }
      this.selectNode(node.key);
      return true;
    }
    return false;
  };

  LinkManager.prototype.moveNode = function(nodeKey, x, y) {
    var i, len, listener, node, ref, results;
    node = this.nodeKeys[nodeKey];
    if (!node) {
      return;
    }
    node.x = x;
    node.y = y;
    ref = this.nodeListeners;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      listener = ref[i];
      log.info("notifying of NodeMove");
      results.push(listener.handleNodeMove(node));
    }
    return results;
  };

  LinkManager.prototype.selectNode = function(nodeKey) {
    var i, len, listener, ref, results;
    if (this.selectedNode) {
      this.selectedNode.selected = false;
    }
    if (this.selectedLink) {
      this.selectedLink.selected = false;
      this.selectedLink = null;
    }
    this.selectedNode = this.nodeKeys[nodeKey];
    if (this.selectedNode) {
      this.selectedNode.selected = true;
      log.info("Selection happened for " + nodeKey + " -- " + this.selectedNode.title);
    }
    ref = this.selectionListeners;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      listener = ref[i];
      results.push(listener({
        node: this.selectedNode,
        connection: null
      }));
    }
    return results;
  };

  LinkManager.prototype.changeNode = function(title, image) {
    var i, len, listener, ref, results;
    if (this.selectedNode) {
      log.info("Change  for " + this.selectedNode.title);
      this.selectedNode.title = title;
      this.selectedNode.image = image;
      ref = this.selectionListeners;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        listener = ref[i];
        results.push(listener({
          node: this.selectedNode,
          connection: null
        }));
      }
      return results;
    }
  };

  LinkManager.prototype.selectLink = function(link) {
    var i, len, listener, ref, results;
    if (this.selectedLink) {
      this.selectedLink.selected = false;
    }
    if (this.selectedNode) {
      this.selectedNode.selected = false;
      this.selectedNode = null;
    }
    this.selectedLink = link;
    if (link != null) {
      link.selected = true;
    }
    ref = this.selectionListeners;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      listener = ref[i];
      results.push(listener({
        node: null,
        connection: this.selectedLink
      }));
    }
    return results;
  };

  LinkManager.prototype.changeLink = function(title, color, deleted) {
    var i, len, listener, ref, results;
    if (this.selectedLink) {
      log.info("Change  for " + this.selectedLink.title);
      if (deleted) {
        return this.removeSelectedLink();
      } else {
        this.selectedLink.title = title;
        this.selectedLink.color = color;
        ref = this.selectionListeners;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          listener = ref[i];
          results.push(listener({
            node: null,
            connection: this.selectedLink
          }));
        }
        return results;
      }
    }
  };

  LinkManager.prototype._nameForNode = function(node) {
    return this.nodeKeys[node];
  };

  LinkManager.prototype.newLinkFromEvent = function(info) {
    var endKey, endTerminal, newLink, startKey, startTerminal;
    newLink = {};
    startKey = $(info.source).data('node-key') || 'undefined';
    endKey = $(info.target).data('node-key') || 'undefined';
    startTerminal = info.connection.endpoints[0].anchor.type === "Top" ? "a" : "b";
    endTerminal = info.connection.endpoints[1].anchor.type === "Top" ? "a" : "b";
    this.importLink({
      sourceNode: startKey,
      targetNode: endKey,
      sourceTerminal: startTerminal,
      targetTerminal: endTerminal,
      color: info.color,
      title: info.title
    });
    return true;
  };

  LinkManager.prototype.removelink = function(link) {
    var key;
    key = link.terminalKey();
    return delete this.linkKeys[key];
  };

  LinkManager.prototype.deleteAll = function() {
    var node;
    for (node in this.nodeKeys) {
      this.removeNode(node);
    }
    return this.setFilename('New Model');
  };

  LinkManager.prototype.deleteSelected = function() {
    log.info("Deleting selected items");
    this.removeSelectedLink();
    return this.removeSelectedNode();
  };

  LinkManager.prototype.removeSelectedNode = function() {
    var i, len, listener, ref, results;
    if (this.selectedNode) {
      this.removeNode(this.selectedNode.key);
      ref = this.selectionListeners;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        listener = ref[i];
        results.push(listener({
          node: null,
          connection: null
        }));
      }
      return results;
    }
  };

  LinkManager.prototype.removeSelectedLink = function() {
    var i, j, len, len1, listener, ref, ref1, results;
    if (this.selectedLink) {
      this.removelink(this.selectedLink);
      ref = this.linkListeners;
      for (i = 0, len = ref.length; i < len; i++) {
        listener = ref[i];
        log.info("notifying of deleted Link");
        listener.handleLinkRm(this.selectedLink);
      }
      this.selectedLink = null;
      ref1 = this.selectionListeners;
      results = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        listener = ref1[j];
        results.push(listener({
          node: null,
          connection: null
        }));
      }
      return results;
    }
  };

  LinkManager.prototype.removeLinksForNode = function(node) {
    var i, len, link, ref, results;
    ref = node.links;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      link = ref[i];
      results.push(this.removelink(link));
    }
    return results;
  };

  LinkManager.prototype.removeNode = function(nodeKey) {
    var i, j, len, len1, listener, node, ref, ref1, results;
    node = this.nodeKeys[nodeKey];
    delete this.nodeKeys[nodeKey];
    this.removeLinksForNode(node);
    ref = this.nodeListeners;
    for (i = 0, len = ref.length; i < len; i++) {
      listener = ref[i];
      log.info("notifying of deleted Node");
      listener.handleNodeRm(node);
    }
    this.selectedNode = null;
    ref1 = this.selectionListeners;
    results = [];
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      listener = ref1[j];
      results.push(listener({
        node: null,
        connection: null
      }));
    }
    return results;
  };

  LinkManager.prototype.loadData = function(data) {
    var i, importer, len, listener, ref, results;
    log.info("json success");
    importer = new Importer(this);
    importer.importData(data);
    this.setFilename(data.filename || 'New Model');
    ref = this.loadListeners;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      listener = ref[i];
      results.push(listener(data));
    }
    return results;
  };

  LinkManager.prototype.loadDataFromUrl = function(url) {
    log.info("loading local data");
    log.info("url " + url);
    return $.ajax({
      url: url,
      dataType: 'json',
      success: (function(_this) {
        return function(data) {
          return _this.loadData(data);
        };
      })(this),
      error: function(xhr, status, err) {
        return log.error(url, status, err.toString());
      }
    });
  };

  LinkManager.prototype.serialize = function(palette) {
    var key, link, linkExports, node, nodeExports;
    nodeExports = (function() {
      var ref, results;
      ref = this.nodeKeys;
      results = [];
      for (key in ref) {
        node = ref[key];
        results.push(node.toExport());
      }
      return results;
    }).call(this);
    linkExports = (function() {
      var ref, results;
      ref = this.linkKeys;
      results = [];
      for (key in ref) {
        link = ref[key];
        results.push(link.toExport());
      }
      return results;
    }).call(this);
    return {
      version: 0.1,
      filename: this.filename,
      palette: palette,
      nodes: nodeExports,
      links: linkExports
    };
  };

  LinkManager.prototype.toJsonString = function(palette) {
    return JSON.stringify(this.serialize(palette));
  };

  return LinkManager;

})();



},{"../utils/importer":10,"./link":6,"./node":7}],6:[function(require,module,exports){
var GraphPrimitive, Link,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

GraphPrimitive = require('./graph-primitive');

module.exports = Link = (function(superClass) {
  extend(Link, superClass);

  Link.defaultColor = "#777";

  function Link(options) {
    var base, base1, ref;
    this.options = options != null ? options : {};
    if ((base = this.options).color == null) {
      base.color = Link.defaultColor;
    }
    if ((base1 = this.options).title == null) {
      base1.title = '';
    }
    ref = this.options, this.sourceNode = ref.sourceNode, this.sourceTerminal = ref.sourceTerminal, this.targetNode = ref.targetNode, this.targetTerminal = ref.targetTerminal, this.color = ref.color, this.title = ref.title;
    Link.__super__.constructor.call(this);
  }

  Link.prototype.type = 'Link';

  Link.prototype.terminalKey = function() {
    return this.sourceNode.key + "[" + this.sourceTerminal + "] ---" + this.key + "---> " + this.targetNode.key + "[" + this.targetTerminal + "]";
  };

  Link.prototype.nodeKey = function() {
    return this.sourceNode + " ---" + this.key + "---> " + this.targetNode;
  };

  Link.prototype.outs = function() {
    return [this.targetNode];
  };

  Link.prototype.ins = function() {
    return [this.sourceNode];
  };

  Link.prototype.toExport = function() {
    return {
      "title": this.title,
      "color": this.color,
      "sourceNodeKey": this.sourceNode.key,
      "sourceTerminal": this.sourceTerminal,
      "targetNodeKey": this.targetNode.key,
      "targetTerminal": this.targetTerminal
    };
  };

  return Link;

})(GraphPrimitive);



},{"./graph-primitive":4}],7:[function(require,module,exports){
var GraphPrimitive, Node,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

GraphPrimitive = require('./graph-primitive.coffee');

module.exports = Node = (function(superClass) {
  extend(Node, superClass);

  function Node(nodeSpec, key) {
    if (nodeSpec == null) {
      nodeSpec = {
        x: 0,
        y: 0,
        title: "untitled",
        image: null
      };
    }
    Node.__super__.constructor.call(this);
    if (key) {
      this.key = key;
    }
    this.links = [];
    this.x = nodeSpec.x;
    this.y = nodeSpec.y;
    this.title = nodeSpec.title;
    this.image = nodeSpec.image;
  }

  Node.prototype.type = 'Node';

  Node.prototype.addLink = function(link) {
    if (link.sourceNode === this || link.targetNode === this) {
      if (_.contains(this.links, link)) {
        throw new Error("Duplicate link for Node:" + this.id);
      }
      return this.links.push(link);
    } else {
      throw new Error("Bad link for Node:" + this.id);
    }
  };

  Node.prototype.outLinks = function() {
    return _.filter(this.links, (function(_this) {
      return function(link) {
        return link.sourceNode === _this;
      };
    })(this));
  };

  Node.prototype.inLinks = function() {
    return _.filter(this.links, (function(_this) {
      return function(link) {
        return link.targetNode === _this;
      };
    })(this));
  };

  Node.prototype.infoString = function() {
    var link, linkNamer, outs;
    linkNamer = function(link) {
      return " --" + link.title + "-->[" + link.targetNode.title + "]";
    };
    outs = (function() {
      var i, len, ref, results;
      ref = this.outLinks();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        link = ref[i];
        results.push(linkNamer(link));
      }
      return results;
    }).call(this);
    return this.title + " " + outs;
  };

  Node.prototype.downstreamNodes = function() {
    var visit, visitedNodes;
    visitedNodes = [];
    visit = function(node) {
      log.info("visiting node: " + node.id);
      visitedNodes.push(node);
      return _.each(node.outLinks(), function(link) {
        var downstreamNode;
        downstreamNode = link.targetNode;
        if (!_.contains(visitedNodes, downstreamNode)) {
          return visit(downstreamNode);
        }
      });
    };
    visit(this);
    return _.without(visitedNodes, this);
  };

  Node.prototype.toExport = function() {
    return {
      title: this.title,
      x: this.x,
      y: this.y,
      image: this.image,
      key: this.key
    };
  };

  return Node;

})(GraphPrimitive);



},{"./graph-primitive.coffee":4}],8:[function(require,module,exports){
var DropImageHandler;

module.exports = DropImageHandler = (function() {
  function DropImageHandler(options) {
    this.maxWidth = options.maxWidth, this.maxHeight = options.maxHeight;
  }

  DropImageHandler.prototype._resizeImage = function(filename, src, callback) {
    var img;
    img = document.createElement('img');
    img.src = src;
    return img.onload = (function(_this) {
      return function() {
        var canvas, height, width;
        canvas = document.createElement('canvas');
        width = img.width, height = img.height;
        if (width > height) {
          if (width > _this.maxWidth) {
            height *= _this.maxWidth / width;
            width = _this.maxWidth;
          }
        } else {
          if (height > _this.maxHeight) {
            width *= _this.maxHeight / height;
            height = _this.maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        return callback({
          name: filename,
          title: (filename.split('.'))[0],
          image: canvas.toDataURL('image/png')
        });
      };
    })(this);
  };

  DropImageHandler.prototype.handleDrop = function(e, callback) {
    var file, i, len, reader, ref, results, url;
    if (e.dataTransfer.files.length > 0) {
      ref = e.dataTransfer.files;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        if (/^image\//.test(file.type)) {
          reader = new FileReader();
          reader.addEventListener('loadend', (function(_this) {
            return function(e) {
              return _this._resizeImage(file.name, e.target.result, callback);
            };
          })(this));
          results.push(reader.readAsDataURL(file));
        } else {
          results.push(void 0);
        }
      }
      return results;
    } else {
      url = e.dataTransfer.getData('URL');
      if (url) {
        return callback({
          name: '',
          title: '',
          image: url
        });
      }
    }
  };

  return DropImageHandler;

})();



},{}],9:[function(require,module,exports){
var GoogleDriveIO;

module.exports = GoogleDriveIO = (function() {
  function GoogleDriveIO() {}

  GoogleDriveIO.prototype.APP_ID = '1095918012594';

  GoogleDriveIO.prototype.DEVELOPER_KEY = 'AIzaSyAUobrEXqtbZHBvr24tamdE6JxmPYTRPEA';

  GoogleDriveIO.prototype.CLIENT_ID = '1095918012594-svs72eqfalasuc4t1p1ps1m8r9b8psso.apps.googleusercontent.com';

  GoogleDriveIO.prototype.SCOPES = 'https://www.googleapis.com/auth/drive';

  GoogleDriveIO.prototype.authorized = false;

  GoogleDriveIO.prototype.authorize = function(immediate, callback) {
    var args;
    args = {
      'client_id': this.CLIENT_ID,
      'scope': this.SCOPES,
      'immediate': immediate || false
    };
    return gapi.auth.authorize(args, (function(_this) {
      return function(token) {
        var err;
        if (callback) {
          err = (!token ? 'Unable to authorize' : token.error ? token.error : null);
          _this.authorized = err === null;
          return callback(err, token);
        }
      };
    })(this));
  };

  GoogleDriveIO.prototype.makeMultipartBody = function(parts, boundary) {
    var part;
    return (((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = parts.length; i < len; i++) {
        part = parts[i];
        results.push("\r\n--" + boundary + "\r\nContent-Type: application/json\r\n\r\n" + part);
      }
      return results;
    })()).join('')) + ("\r\n--" + boundary + "--");
  };

  GoogleDriveIO.prototype.sendFile = function(fileSpec, contents, callback) {
    var boundary, metadata, method, path, ref, request;
    boundary = '-------314159265358979323846';
    metadata = JSON.stringify({
      title: fileSpec.fileName,
      mimeType: 'application/json'
    });
    ref = fileSpec.fileId ? ['PUT', "/upload/drive/v2/files/" + fileSpec.fileId] : ['POST', '/upload/drive/v2/files'], method = ref[0], path = ref[1];
    request = gapi.client.request({
      path: path,
      method: method,
      params: {
        uploadType: 'multipart',
        alt: 'json'
      },
      headers: {
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
      },
      body: this.makeMultipartBody([metadata, contents], boundary)
    });
    return request.execute(function(file) {
      if (callback) {
        if (file) {
          return callback(null, file);
        } else {
          return callback('Unabled to upload file');
        }
      }
    });
  };

  GoogleDriveIO.prototype.upload = function(fileSpec, contents, callback) {
    return this.authorize(this.authorized, (function(_this) {
      return function(err) {
        if (!err) {
          return gapi.client.load('drive', 'v2', function() {
            return _this.sendFile(fileSpec, contents, callback);
          });
        } else {
          return callback("No authorization. Upload failed for file: " + fileSpec.fileName);
        }
      };
    })(this));
  };

  GoogleDriveIO.prototype.download = function(fileSpec, callback) {
    return this.authorize(this.authorized, function(err, token) {
      if (err) {
        return callback(err);
      } else {
        return gapi.client.load('drive', 'v2', function() {
          var request;
          request = gapi.client.drive.files.get({
            fileId: fileSpec.id
          });
          return request.execute(function(file) {
            var xhr;
            if (file != null ? file.downloadUrl : void 0) {
              xhr = new XMLHttpRequest();
              xhr.open('GET', file.downloadUrl);
              xhr.setRequestHeader('Authorization', "Bearer " + token.access_token);
              xhr.onload = function() {
                var e, json;
                try {
                  json = JSON.parse(xhr.responseText);
                } catch (_error) {
                  e = _error;
                  callback(e);
                  return;
                }
                return callback(null, json);
              };
              xhr.onerror = function() {
                return callback("Unable to download " + file.downloadUrl);
              };
              return xhr.send();
            } else {
              return callback("Unable to get download url");
            }
          });
        });
      }
    });
  };

  GoogleDriveIO.prototype.filePicker = function(callback) {
    return this.authorize(this.authorized, function(err, token) {
      if (err) {
        return callback(err);
      } else {
        return gapi.load('picker', {
          callback: function() {
            var picker, pickerCallback;
            pickerCallback = function(data, etc) {
              return callback(null, data.action === 'picked' ? data.docs[0] : null);
            };
            picker = new google.picker.PickerBuilder().addView(google.picker.ViewId.DOCS).setOAuthToken(token.access_token).setCallback(pickerCallback).build();
            return picker.setVisible(true);
          }
        });
      }
    });
  };

  return GoogleDriveIO;

})();



},{}],10:[function(require,module,exports){
var MySystemImporter;

module.exports = MySystemImporter = (function() {
  function MySystemImporter(system) {
    this.system = system;
    void 0;
  }

  MySystemImporter.prototype.importData = function(data) {
    this.importNodes(data.nodes);
    return this.importLinks(data.links);
  };

  MySystemImporter.prototype.importNodes = function(importNodes) {
    var data, i, len, results;
    results = [];
    for (i = 0, len = importNodes.length; i < len; i++) {
      data = importNodes[i];
      results.push(this.system.importNode({
        key: data.key,
        data: data
      }));
    }
    return results;
  };

  MySystemImporter.prototype.importLinks = function(links) {
    var data, i, len, results;
    results = [];
    for (i = 0, len = links.length; i < len; i++) {
      data = links[i];
      results.push(this.system.importLink({
        sourceNode: data.sourceNodeKey,
        targetNode: data.targetNodeKey,
        sourceTerminal: data.sourceTerminal,
        targetTerminal: data.targetTerminal,
        title: data.title,
        color: data.color
      }));
    }
    return results;
  };

  return MySystemImporter;

})();



},{}],11:[function(require,module,exports){
var DiagramToolkit;

module.exports = DiagramToolkit = (function() {
  function DiagramToolkit(domContext, options) {
    this.domContext = domContext;
    this.options = options != null ? options : {};
    this.type = 'jsPlumbWrappingDiagramToolkit';
    this.color = this.options.color || '#233';
    this.lineWidth = this.options.lineWidth || 2;
    this.kit = jsPlumb.getInstance({
      Container: this.domContext
    });
    this.kit.importDefaults({
      Connector: [
        'Bezier', {
          curviness: 50
        }
      ],
      Anchors: ['TopCenter', 'BottomCenter'],
      Endpoint: this._endpointOptions,
      DragOptions: {
        cursor: 'pointer',
        zIndex: 2000
      },
      DoNotThrowErrors: false
    });
    this.registerListeners();
  }

  DiagramToolkit.prototype.registerListeners = function() {
    return this.kit.bind('connection', this.handleConnect.bind(this));
  };

  DiagramToolkit.prototype.handleConnect = function(info, evnt) {
    var base;
    if (typeof (base = this.options).handleConnect === "function") {
      base.handleConnect(info, evnt);
    }
    return true;
  };

  DiagramToolkit.prototype.handleClick = function(connection, evnt) {
    var base;
    return typeof (base = this.options).handleClick === "function" ? base.handleClick(connection, evnt) : void 0;
  };

  DiagramToolkit.prototype.handleLabelClick = function(label, evnt) {
    var base;
    return typeof (base = this.options).handleClick === "function" ? base.handleClick(label.component, evnt) : void 0;
  };

  DiagramToolkit.prototype.handleDisconnect = function(info, evnt) {
    var base;
    return (typeof (base = this.options).handleDisconnect === "function" ? base.handleDisconnect(info, evnt) : void 0) || true;
  };

  DiagramToolkit.prototype.repaint = function() {
    return this.kit.repaintEverything();
  };

  DiagramToolkit.prototype._endpointOptions = [
    "Dot", {
      radius: 15
    }
  ];

  DiagramToolkit.prototype.makeTarget = function(div) {
    var opts;
    opts = (function(_this) {
      return function(anchor) {
        return {
          isTarget: true,
          isSource: true,
          endpoint: _this._endpointOptions,
          connector: ['Bezier'],
          anchor: anchor,
          paintStyle: _this._paintStyle(),
          maxConnections: -1
        };
      };
    })(this);
    this.kit.addEndpoint(div, opts('Top'));
    return this.kit.addEndpoint(div, opts('Bottom'));
  };

  DiagramToolkit.prototype.clear = function() {
    if (this.kit) {
      this.kit.deleteEveryEndpoint();
      this.kit.reset();
      return this.registerListeners();
    } else {
      return console.log('No kit defined');
    }
  };

  DiagramToolkit.prototype._paintStyle = function(color) {
    return {
      strokeStyle: color || this.color,
      lineWidth: this.lineWidth,
      outlineColor: "rgb(0,240,10)",
      outlineWidth: "10px"
    };
  };

  DiagramToolkit.prototype._overlays = function(label, selected) {
    var results;
    results = [
      [
        'Arrow', {
          location: 1.0,
          length: 10,
          width: 10,
          events: {
            click: this.handleLabelClick.bind(this)
          }
        }
      ]
    ];
    if ((label != null ? label.length : void 0) > 0) {
      results.push([
        'Label', {
          location: 0.4,
          events: {
            click: this.handleLabelClick.bind(this)
          },
          label: label || '',
          cssClass: "label" + (selected ? ' selected' : '')
        }
      ]);
    }
    return results;
  };

  DiagramToolkit.prototype._clean_borked_endpoints = function() {
    return $('._jsPlumb_endpoint:not(.jsplumb-draggable)').remove();
  };

  DiagramToolkit.prototype.addLink = function(source, target, label, color, source_terminal, target_terminal, linkModel) {
    var connection, paintStyle;
    paintStyle = this._paintStyle(color);
    paintStyle.outlineColor = "none";
    paintStyle.outlineWidth = 20;
    if (linkModel.selected) {
      paintStyle.outlineColor = "yellow";
      paintStyle.outlineWidth = 1;
    }
    connection = this.kit.connect({
      source: source,
      target: target,
      anchors: [source_terminal || "Top", target_terminal || "Bottom"],
      paintStyle: paintStyle,
      overlays: this._overlays(label, linkModel.selected)
    });
    connection.bind('click', this.handleClick.bind(this));
    return connection.linkModel = linkModel;
  };

  DiagramToolkit.prototype.setSuspendDrawing = function(shouldwestop) {
    if (!shouldwestop) {
      this._clean_borked_endpoints();
    }
    return this.kit.setSuspendDrawing(shouldwestop, !shouldwestop);
  };

  DiagramToolkit.prototype.supspendDrawing = function() {
    return this.setSuspendDrawing(true);
  };

  DiagramToolkit.prototype.resumeDrawing = function() {
    return this.setSuspendDrawing(false);
  };

  return DiagramToolkit;

})();



},{}],12:[function(require,module,exports){
module.exports = {
  "~MENU.SAVE": "Save …",
  "~MENU.OPEN": "Open …",
  "~MENU.NEW": "New …",
  "~MENU.SAVE_AS": "Save as …",
  "~MENU.SETTINGS": "Advanced Settings …",
  "~NODE-EDIT.TITLE": "Title",
  "~NODE-EDIT.IMAGE": "Image",
  "~NODE-EDIT.BUILT_IN": "Built-In",
  "~NODE-EDIT.DROPPED": "Dropped",
  "~NODE-EDIT.REMOTE": "Remote",
  "~NODE-EDIT.ADD_REMOTE": "Add remote",
  "~LINK-EDIT.DELETE": "Delete this link",
  "~LINK-EDIT.TITLE": "Title",
  "~LINK-EDIT.COLOR": "Color",
  "~ADD-NEW-IMAGE.TITLE": "Add new image",
  "~ADD-NEW-IMAGE.IMAGE-SEARCH-TAB": "Image Search",
  "~ADD-NEW-IMAGE.MY-COMPUTER-TAB": "My Computer",
  "~ADD-NEW-IMAGE.LINK-TAB": "Link"
};



},{}],13:[function(require,module,exports){
var OpenClipArt;

module.exports = OpenClipArt = {
  jqXHR: null,
  search: function(query, options, callback) {
    var ref, url;
    if ((ref = OpenClipArt.jqXHR) != null) {
      ref.abort();
    }
    url = "https://openclipart.org/search/json/?query=" + (encodeURIComponent(query)) + "&amount=" + (options.limitResults ? 18 : 200);
    return OpenClipArt.jqXHR = $.getJSON(url, function(data) {
      var i, item, len, numMatches, ref1, ref2, results;
      results = [];
      numMatches = Math.min(parseInt((data != null ? (ref1 = data.info) != null ? ref1.results : void 0 : void 0) || '0', 10), 200);
      ref2 = data != null ? data.payload : void 0;
      for (i = 0, len = ref2.length; i < len; i++) {
        item = ref2[i];
        results.push({
          title: item.title,
          image: item.svg.url
        });
      }
      return callback(results, numMatches);
    });
  }
};



},{}],14:[function(require,module,exports){
var defaultLang, translate, translations;

translations = {};

translations['en'] = require('./lang/us-en');

defaultLang = 'en';

translate = function(key, lang) {
  var ref;
  if (lang == null) {
    lang = defaultLang;
  }
  return ((ref = translations[lang]) != null ? ref[key] : void 0) || key;
};

module.exports = translate;



},{"./lang/us-en":12}],15:[function(require,module,exports){
var GlobalNav, ImageBrowser, InspectorPanel, LinkEditView, LinkView, NodeEditView, NodeWell, Placeholder, a, div, ref;

Placeholder = React.createFactory(require('./placeholder-view'));

GlobalNav = React.createFactory(require('./global-nav-view'));

LinkView = React.createFactory(require('./link-view'));

NodeWell = React.createFactory(require('./node-well-view'));

NodeEditView = React.createFactory(require('./node-edit-view'));

LinkEditView = React.createFactory(require('./link-edit-view'));

InspectorPanel = React.createFactory(require('./inspector-panel-view'));

ImageBrowser = React.createFactory(require('./image-browser-view'));

ref = React.DOM, div = ref.div, a = ref.a;

module.exports = React.createClass({
  displayName: 'WirefameApp',
  mixins: [require('../mixins/app-view')],
  getInitialState: function() {
    var iframed;
    try {
      iframed = window.self !== window.top;
    } catch (_error) {
      iframed = true;
    }
    return this.getInitialAppViewState({
      iframed: iframed,
      username: 'Jane Doe',
      filename: 'Untitled Model'
    });
  },
  toggleImageBrowser: function() {
    return this.setState({
      showImageBrowser: !this.state.showImageBrowser
    });
  },
  render: function() {
    return div({
      className: 'app'
    }, div({
      className: this.state.iframed ? 'iframed-workspace' : 'workspace'
    }, !this.state.iframed ? GlobalNav({
      filename: this.state.filename,
      username: this.state.username,
      linkManager: this.props.linkManager,
      getData: this.getData
    }) : void 0, div({
      className: 'action-bar'
    }, NodeWell({
      protoNodes: this.state.protoNodes
    }), Placeholder({
      label: 'Document Actions',
      className: 'document-actions'
    })), div({
      className: 'canvas'
    }, LinkView({
      linkManager: this.props.linkManager,
      selectedLink: this.state.selectedConnection
    })), InspectorPanel({
      node: this.state.selectedNode,
      link: this.state.selectedConnection,
      onNodeChanged: this.onNodeChanged,
      onLinkChanged: this.onLinkChanged,
      protoNodes: this.state.protoNodes,
      toggleImageBrowser: this.toggleImageBrowser
    }), this.state.showImageBrowser ? ImageBrowser({
      protoNodes: this.state.protoNodes,
      addToPalette: this.addToPalette,
      close: this.toggleImageBrowser
    }) : void 0));
  }
});



},{"../mixins/app-view":2,"./global-nav-view":17,"./image-browser-view":18,"./inspector-panel-view":19,"./link-edit-view":20,"./link-view":21,"./node-edit-view":25,"./node-well-view":27,"./placeholder-view":29}],16:[function(require,module,exports){
var div, i, li, ref, span, ul;

ref = React.DOM, div = ref.div, i = ref.i, span = ref.span, ul = ref.ul, li = ref.li;

module.exports = React.createClass({
  displayName: 'Dropdown',
  getInitialState: function() {
    return {
      showingMenu: false,
      timeout: null
    };
  },
  blur: function() {
    var timeout;
    this.unblur();
    timeout = setTimeout(((function(_this) {
      return function() {
        return _this.setState({
          showingMenu: false
        });
      };
    })(this)), 500);
    return this.setState({
      timeout: timeout
    });
  },
  unblur: function() {
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }
    return this.setState({
      timeout: null
    });
  },
  select: function(item) {
    var nextState;
    nextState = !this.state.showingMenu;
    this.setState({
      showingMenu: nextState
    });
    if (item && item.action) {
      return item.action();
    } else if (item && item.name) {
      return alert("no action for " + item.name);
    }
  },
  render: function() {
    var className, item, menuClass, select, showing;
    showing = this.state.showingMenu;
    menuClass = 'menu-hidden';
    select = (function(_this) {
      return function(item) {
        return function() {
          return _this.select(item);
        };
      };
    })(this);
    if (showing) {
      menuClass = 'menu-showing';
    }
    return div({
      className: 'menu'
    }, span({
      className: 'menu-anchor',
      onClick: (function(_this) {
        return function() {
          return _this.select(null);
        };
      })(this)
    }, this.props.anchor, i({
      className: 'fa fa-caret-down'
    })), div({
      className: menuClass,
      onMouseLeave: this.blur,
      onMouseEnter: this.unblur
    }, ul({}, (function() {
      var j, len, ref1, results;
      ref1 = this.props.items;
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        item = ref1[j];
        className = "menuItem";
        if (!item.action) {
          className = className + " disabled";
        }
        results.push(li({
          className: className,
          onClick: select(item)
        }, item.name));
      }
      return results;
    }).call(this))));
  }
});



},{}],17:[function(require,module,exports){
var Dropdown, div, i, ref, span, tr;

ref = React.DOM, div = ref.div, i = ref.i, span = ref.span;

tr = require('../utils/translate');

Dropdown = React.createFactory(require('./dropdown-view'));

module.exports = React.createClass({
  displayName: 'GlobalNav',
  mixins: [require('../mixins/google-file-interface')],
  getInitialState: function() {
    return this.getInitialAppViewState({});
  },
  componentDidMount: function() {
    return this.createGoogleDrive();
  },
  render: function() {
    var options;
    options = [
      {
        name: tr("~MENU.NEW"),
        action: this.newFile
      }, {
        name: tr("~MENU.OPEN"),
        action: this.openFile
      }, {
        name: tr("~MENU.SAVE"),
        action: this.saveFile
      }, {
        name: tr("~MENU.SAVE_AS"),
        action: false
      }, {
        name: tr('~MENU.SETTINGS'),
        action: false
      }
    ];
    return div({
      className: 'global-nav non-placeholder'
    }, Dropdown({
      anchor: this.props.filename,
      items: options,
      className: 'global-nav-content-filename'
    }), this.state.action ? div({}, i({
      className: "fa fa-cog fa-spin"
    }), this.state.action) : void 0, div({
      className: 'global-nav-name-and-help'
    }, span({
      className: 'mockup-only'
    }, this.props.username), span({
      className: 'mockup-only'
    }, i({
      className: 'fa fa-2x fa-question-circle'
    }))));
  }
});



},{"../mixins/google-file-interface":3,"../utils/translate":14,"./dropdown-view":16}],18:[function(require,module,exports){
var ImageSearch, ImageSearchResult, Link, ModalTabbedDialog, ModalTabbedDialogFactory, MyComputer, OpenClipart, PreviewImage, a, button, div, i, img, input, ref, tr;

ModalTabbedDialog = require('./modal-tabbed-dialog-view');

ModalTabbedDialogFactory = React.createFactory(ModalTabbedDialog);

OpenClipart = require('../utils/open-clipart');

tr = require('../utils/translate');

ref = React.DOM, div = ref.div, input = ref.input, button = ref.button, img = ref.img, i = ref.i, a = ref.a;

ImageSearchResult = React.createFactory(React.createClass({
  displayName: 'ImageSearchResult',
  getInitialState: function() {
    return {
      loaded: false
    };
  },
  componentDidMount: function() {
    var image;
    image = new Image();
    image.src = this.props.imageInfo.image;
    return image.onload = (function(_this) {
      return function() {
        return _this.setState({
          loaded: true
        });
      };
    })(this);
  },
  clicked: function() {
    return this.props.clicked(this.props.imageInfo);
  },
  render: function() {
    var src;
    src = this.state.loaded ? this.props.imageInfo.image : 'img/bb-chrome/spin.svg';
    return img({
      src: src,
      onClick: this.clicked,
      title: this.props.imageInfo.title
    });
  }
}));

PreviewImage = React.createFactory(React.createClass({
  displayName: 'ImageSearchResult',
  cancel: function(e) {
    e.preventDefault();
    return this.props.addImage(null);
  },
  addImage: function() {
    return this.props.addImage(this.props.imageInfo);
  },
  render: function() {
    return div({}, div({
      className: 'image-browser-header'
    }, 'Preview Your Image'), div({
      className: 'image-browser-preview-image'
    }, img({
      src: this.props.imageInfo.image
    }), a({
      href: '#',
      onClick: this.cancel
    }, i({
      className: "fa fa-close"
    }), 'cancel')), div({
      className: 'image-browser-preview-add-image'
    }, button({
      onClick: this.addImage
    }, 'Add Image')), div({
      style: {
        clear: 'both',
        marginTop: 10
      }
    }, 'TBD: Metadata'));
  }
}));

ImageSearch = React.createFactory(React.createClass({
  displayName: 'ImageSearch',
  getInitialState: function() {
    return {
      searching: false,
      searched: false,
      internalLibrary: this.props.protoNodes,
      internalResults: this.props.protoNodes,
      externalResults: [],
      selectedImage: null
    };
  },
  changed: function() {
    return this.search({
      limitResults: true,
      useTimeout: true
    });
  },
  showAllMatches: function() {
    return this.search({
      limitResults: false,
      useTimeout: false
    });
  },
  search: function(options) {
    var internalResults, query, queryRegEx, search, validQuery;
    query = $.trim(this.refs.search.getDOMNode().value);
    validQuery = query.length > 0;
    queryRegEx = new RegExp(query, 'i');
    internalResults = _.filter(this.props.protoNodes, function(node) {
      return queryRegEx.test(node.title);
    });
    this.setState({
      query: query,
      searchable: validQuery,
      searching: validQuery,
      searchingAll: validQuery && !options.limitResults,
      searched: false,
      internalResults: internalResults,
      externalResults: [],
      numExternalMatches: 0
    });
    clearTimeout(this.searchTimeout);
    search = (function(_this) {
      return function() {
        return OpenClipart.search(query, options, function(results, numMatches) {
          return _this.setState({
            searching: false,
            searched: true,
            externalResults: results,
            numExternalMatches: numMatches
          });
        });
      };
    })(this);
    if (options.useTimeout) {
      return this.searchTimeout = setTimeout(search, 1000);
    } else {
      return search();
    }
  },
  componentDidMount: function() {
    return this.refs.search.getDOMNode().focus();
  },
  imageClicked: function(imageInfo) {
    return this.setState({
      selectedImage: imageInfo
    });
  },
  addImage: function(imageInfo) {
    if (imageInfo) {
      this.props.addToPalette(imageInfo);
    }
    return this.setState({
      selectedImage: null
    });
  },
  render: function() {
    var index, node, showNoResultsAlert;
    showNoResultsAlert = this.state.searchable && this.state.searched && (this.state.internalResults.length + this.state.externalResults.length) === 0;
    return div({
      className: 'image-browser'
    }, this.state.selectedImage ? PreviewImage({
      imageInfo: this.state.selectedImage,
      addImage: this.addImage
    }) : div({}, div({
      className: 'image-browser-form'
    }, input({
      ref: 'search',
      placeholder: 'Search Internal Library and Openclipart.org',
      value: this.state.query,
      onChange: this.changed
    }), button({}, 'Search')), showNoResultsAlert ? div({
      className: 'modal-dialog-alert'
    }, 'Sorry, no images found.  Try another search, or browse internal library images below.') : void 0, div({
      className: 'image-browser-header'
    }, 'Internal Library Images'), div({
      className: 'image-browser-results'
    }, (function() {
      var j, len, ref1, results1;
      if (this.state.internalResults.length === 0 && (this.state.searching || this.state.externalResults.length > 0)) {
        return " No internal library results found for '" + this.state.query + "'";
      } else {
        ref1 = (showNoResultsAlert ? this.state.internalLibrary : this.state.internalResults);
        results1 = [];
        for (index = j = 0, len = ref1.length; j < len; index = ++j) {
          node = ref1[index];
          if (node.image && !node.image.match(/^(https?|data):/)) {
            if (node.image) {
              results1.push(ImageSearchResult({
                key: index,
                imageInfo: node,
                clicked: this.imageClicked
              }));
            } else {
              results1.push(void 0);
            }
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      }
    }).call(this)), this.state.searchable && !showNoResultsAlert ? div({}, div({
      className: 'image-browser-header'
    }, 'Openclipart.org Images'), div({
      className: 'image-browser-results'
    }, (function() {
      var j, len, ref1, results1;
      if (this.state.searching) {
        return div({}, i({
          className: "fa fa-cog fa-spin"
        }), " Searching for " + (this.state.searchingAll ? 'all matches for ' : '') + "'" + this.state.query + "'...");
      } else if (this.state.externalResults.length === 0) {
        return " No openclipart.org results found for '" + this.state.query + "'";
      } else {
        ref1 = this.state.externalResults;
        results1 = [];
        for (index = j = 0, len = ref1.length; j < len; index = ++j) {
          node = ref1[index];
          results1.push(ImageSearchResult({
            key: index,
            imageInfo: node,
            clicked: this.imageClicked
          }));
        }
        return results1;
      }
    }).call(this)), this.state.externalResults.length < this.state.numExternalMatches ? div({}, "Showing " + this.state.externalResults.length + " of " + this.state.numExternalMatches + " matches for '" + this.state.query + "'. ", a({
      href: '#',
      onClick: this.showAllMatches
    }, 'Show all matches.')) : void 0) : void 0));
  }
}));

MyComputer = React.createFactory(React.createClass({
  displayName: 'MyComputer',
  render: function() {
    return div({}, 'My Computer: TBD');
  }
}));

Link = React.createFactory(React.createClass({
  displayName: 'Link',
  render: function() {
    return div({}, 'Link: TBD');
  }
}));

module.exports = React.createClass({
  displayName: 'Image Browser',
  render: function() {
    return ModalTabbedDialogFactory({
      title: tr("~ADD-NEW-IMAGE.TITLE"),
      close: this.props.close,
      tabs: [
        ModalTabbedDialog.Tab({
          label: tr("~ADD-NEW-IMAGE.IMAGE-SEARCH-TAB"),
          component: ImageSearch({
            protoNodes: this.props.protoNodes,
            addToPalette: this.props.addToPalette
          })
        }), ModalTabbedDialog.Tab({
          label: tr("~ADD-NEW-IMAGE.MY-COMPUTER-TAB"),
          component: MyComputer({})
        }), ModalTabbedDialog.Tab({
          label: tr("~ADD-NEW-IMAGE.LINK-TAB"),
          component: Link({})
        })
      ]
    });
  }
});



},{"../utils/open-clipart":13,"../utils/translate":14,"./modal-tabbed-dialog-view":23}],19:[function(require,module,exports){
var LinkEditView, NodeEditView, PaletteInspectorView, div, i, ref;

NodeEditView = React.createFactory(require('./node-edit-view'));

LinkEditView = React.createFactory(require('./link-edit-view'));

PaletteInspectorView = React.createFactory(require('./palette-inspector-view'));

ref = React.DOM, div = ref.div, i = ref.i;

module.exports = React.createClass({
  displayName: 'InspectorPanelView',
  getInitialState: function() {
    return {
      expanded: true
    };
  },
  collapse: function() {
    return this.setState({
      expanded: false
    });
  },
  expand: function() {
    return this.setState({
      expanded: true
    });
  },
  render: function() {
    var action, className;
    className = "inspector-panel";
    action = this.collapse;
    if (this.state.expanded === false) {
      className = className + " collapsed";
      action = this.expand;
    }
    return div({
      className: className
    }, div({
      className: 'inspector-panel-toggle',
      onClick: action
    }), div({
      className: "inspector-panel-content"
    }, this.props.node ? NodeEditView({
      node: this.props.node,
      onNodeChanged: this.props.onNodeChanged,
      protoNodes: this.props.protoNodes
    }) : this.props.link ? LinkEditView({
      link: this.props.link,
      onLinkChanged: this.props.onLinkChanged
    }) : PaletteInspectorView({
      protoNodes: this.props.protoNodes,
      toggleImageBrowser: this.props.toggleImageBrowser
    })));
  }
});



},{"./link-edit-view":20,"./node-edit-view":25,"./palette-inspector-view":28}],20:[function(require,module,exports){
var button, div, h2, input, label, palette, palettes, ref, tr;

ref = React.DOM, div = ref.div, h2 = ref.h2, button = ref.button, label = ref.label, input = ref.input;

tr = require("../utils/translate");

palettes = [['#4D6A6D', '#798478', "#A0A083", "#C9ADA1", "#EAE0CC"], ['#351431', '#775253', "#BDC696", "#D1D3C4", "#DFE0DC"], ['#D6F49D', '#EAD637', "#CBA328", "#230C0F", "#A2D3C2"]];

palette = palettes[2];

module.exports = React.createClass({
  displayName: 'LinkEditView',
  notifyChange: function(title, color, deleted) {
    var base;
    return typeof (base = this.props).onLinkChanged === "function" ? base.onLinkChanged(this.props.link, title, color, !!deleted) : void 0;
  },
  changeTitle: function(e) {
    return this.notifyChange(e.target.value, this.props.link.color);
  },
  deleteLink: function() {
    return this.notifyChange(this.props.link.title, this.props.link.color, true);
  },
  pickColor: function(e) {
    return this.notifyChange(this.props.link.title, $(e.target).css('background-color'));
  },
  render: function() {
    var colorCode, i;
    return div({
      className: 'link-edit-view'
    }, h2({}, this.props.link.title), div({
      className: 'edit-row'
    }, button({
      type: 'button',
      className: 'delete',
      onClick: this.deleteLink
    }, tr("~LINK-EDIT.DELETE"))), div({
      className: 'edit-row'
    }, label({
      name: 'title'
    }, tr("~LINK-EDIT.TITLE")), input({
      type: 'text',
      name: 'title',
      value: this.props.link.title,
      onChange: this.changeTitle
    })), div({
      className: 'edit-row'
    }, label({
      name: 'color'
    }, tr("~LINK-EDIT.COLOR")), (function() {
      var j, len, results;
      results = [];
      for (i = j = 0, len = palette.length; j < len; i = ++j) {
        colorCode = palette[i];
        results.push(div({
          className: 'colorChoice',
          key: i,
          style: {
            backgroundColor: colorCode
          },
          onTouchEnd: this.pickColor,
          onClick: this.pickColor
        }));
      }
      return results;
    }).call(this)));
  }
});



},{"../utils/translate":14}],21:[function(require,module,exports){
var DiagramToolkit, DropImageHandler, Importer, Node, NodeList, div;

Node = React.createFactory(require('./node-view'));

Importer = require('../utils/importer');

NodeList = require('../models/link-manager');

DiagramToolkit = require('../utils/js-plumb-diagram-toolkit');

DropImageHandler = require('../utils/drop-image-handler');

div = React.DOM.div;

module.exports = React.createClass({
  displayName: 'LinkView',
  componentDidMount: function() {
    var $container;
    $container = $(this.refs.container.getDOMNode());
    this.diagramToolkit = new DiagramToolkit($container, {
      Container: $container[0],
      handleConnect: this.handleConnect,
      handleClick: this.handleClick
    });
    this._updateToolkit();
    this.props.linkManager.addLinkListener(this);
    this.props.linkManager.addNodeListener(this);
    $container.droppable({
      accept: '.proto-node',
      hoverClass: "ui-state-highlight",
      drop: this.addNode
    });
    return this.dropImageHandler = new DropImageHandler({
      maxWidth: 100,
      maxHeight: 100
    });
  },
  addNode: function(e, ui) {
    var image, offset, ref, title;
    ref = ui.draggable.data(), title = ref.title, image = ref.image;
    offset = $(this.refs.linkView.getDOMNode()).offset();
    return this.props.linkManager.importNode({
      data: {
        x: ui.offset.left - offset.left,
        y: ui.offset.top - offset.top,
        title: title,
        image: image
      }
    });
  },
  getInitialState: function() {
    return {
      nodes: [],
      links: [],
      canDrop: false
    };
  },
  componentWillUpdate: function() {
    var ref;
    return (ref = this.diagramToolkit) != null ? typeof ref.clear === "function" ? ref.clear() : void 0 : void 0;
  },
  componentDidUpdate: function() {
    return this._updateToolkit();
  },
  handleEvent: function(handler) {
    if (this.ignoringEvents) {
      return false;
    } else {
      handler();
      return true;
    }
  },
  onNodeMoved: function(node_event) {
    return this.handleEvent((function(_this) {
      return function() {
        var left, ref, top;
        ref = node_event.extra.position, left = ref.left, top = ref.top;
        return _this.props.linkManager.moveNode(node_event.nodeKey, left, top);
      };
    })(this));
  },
  onNodeDeleted: function(node_event) {
    return this.handleEvent((function(_this) {
      return function() {
        return _this.props.linkManager.removeNode(node_event.nodeKey);
      };
    })(this));
  },
  handleConnect: function(info, evnt) {
    return this.handleEvent((function(_this) {
      return function() {
        return _this.props.linkManager.newLinkFromEvent(info, evnt);
      };
    })(this));
  },
  handleClick: function(connection, evnt) {
    return this.handleEvent((function(_this) {
      return function() {
        return _this.props.linkManager.selectLink(connection.linkModel);
      };
    })(this));
  },
  handleLinkAdd: function(info, evnt) {
    this.setState({
      links: this.props.linkManager.getLinks()
    });
    return true;
  },
  handleLinkRm: function() {
    this.setState({
      links: this.props.linkManager.getLinks()
    });
    return false;
  },
  handleNodeAdd: function(nodeData) {
    this.setState({
      nodes: this.props.linkManager.getNodes()
    });
    return true;
  },
  handleNodeMove: function(nodeData) {
    this.setState({
      nodes: this.props.linkManager.getNodes()
    });
    this.diagramToolkit.repaint();
    return true;
  },
  handleNodeRm: function() {
    this.setState({
      nodes: this.props.linkManager.getNodes()
    });
    return false;
  },
  _nodeForName: function(name) {
    var ref;
    return ((ref = this.refs[name]) != null ? ref.getDOMNode() : void 0) || false;
  },
  _updateNodeValue: function(name, key, value) {
    var changed, i, len, node, ref;
    changed = 0;
    ref = this.state.nodes;
    for (i = 0, len = ref.length; i < len; i++) {
      node = ref[i];
      if (node.key === name) {
        node[key] = value;
        changed++;
      }
    }
    if (changed > 0) {
      return this.setState({
        nodes: this.state.nodes
      });
    }
  },
  _updateToolkit: function() {
    if (this.diagramToolkit) {
      this.ignoringEvents = true;
      this.diagramToolkit.supspendDrawing();
      this._redrawLinks();
      this._redrawTargets();
      this.diagramToolkit.resumeDrawing();
      return this.ignoringEvents = false;
    }
  },
  _redrawTargets: function() {
    return this.diagramToolkit.makeTarget($(this.refs.linkView.getDOMNode()).find('.elm'));
  },
  _redrawLinks: function() {
    var i, len, link, ref, results, source, sourceTerminal, target, targetTerminal;
    ref = this.state.links;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      link = ref[i];
      source = this._nodeForName(link.sourceNode.key);
      target = this._nodeForName(link.targetNode.key);
      if (source && target) {
        sourceTerminal = link.sourceTerminal === 'a' ? 'Top' : 'Bottom';
        targetTerminal = link.targetTerminal === 'a' ? 'Top' : 'Bottom';
        results.push(this.diagramToolkit.addLink(source, target, link.title, link.color, sourceTerminal, targetTerminal, link));
      } else {
        results.push(void 0);
      }
    }
    return results;
  },
  onDragOver: function(e) {
    if (!this.state.canDrop) {
      this.setState({
        canDrop: true
      });
    }
    return e.preventDefault();
  },
  onDragLeave: function(e) {
    this.setState({
      canDrop: false
    });
    return e.preventDefault();
  },
  onDrop: function(e) {
    var dropPos, offset;
    this.setState({
      canDrop: false
    });
    e.preventDefault();
    offset = $(this.refs.linkView.getDOMNode()).offset();
    dropPos = {
      x: e.clientX - offset.left,
      y: e.clientY - offset.top
    };
    return this.dropImageHandler.handleDrop(e, (function(_this) {
      return function(file) {
        return _this.props.linkManager.importNode({
          data: {
            x: dropPos.x,
            y: dropPos.y,
            title: file.title,
            image: file.image
          }
        });
      };
    })(this));
  },
  onContainerClicked: function(e) {
    if (e.target === this.refs.container.getDOMNode()) {
      return this.props.linkManager.selectLink(null);
    }
  },
  render: function() {
    var node;
    return div({
      className: "link-view " + (this.state.canDrop ? 'can-drop' : ''),
      ref: 'linkView',
      onDragOver: this.onDragOver,
      onDrop: this.onDrop,
      onDragLeave: this.onDragLeave
    }, div({
      className: 'container',
      ref: 'container',
      onClick: this.onContainerClicked
    }, (function() {
      var i, len, ref, results;
      ref = this.state.nodes;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        node = ref[i];
        results.push(Node({
          key: node.key,
          data: node,
          selected: node.selected,
          nodeKey: node.key,
          ref: node.key,
          onMove: this.onNodeMoved,
          onDelete: this.onNodeDeleted,
          linkManager: this.props.linkManager
        }));
      }
      return results;
    }).call(this)));
  }
});



},{"../models/link-manager":5,"../utils/drop-image-handler":8,"../utils/importer":10,"../utils/js-plumb-diagram-toolkit":11,"./node-view":26}],22:[function(require,module,exports){
var Modal, div, i, ref;

Modal = React.createFactory(require('./modal-view'));

ref = React.DOM, div = ref.div, i = ref.i;

module.exports = React.createClass({
  displayName: 'ModalDialog',
  close: function() {
    var base;
    return typeof (base = this.props).close === "function" ? base.close() : void 0;
  },
  render: function() {
    return Modal({
      close: this.props.close
    }, div({
      className: 'modal-dialog'
    }, div({
      className: 'modal-dialog-wrapper'
    }, div({
      className: 'modal-dialog-title'
    }, i({
      className: "modal-dialog-title-close fa fa-close",
      onClick: this.close
    }), this.props.title || 'Untitled Dialog'), div({
      className: 'modal-dialog-workspace'
    }, this.props.children))));
  }
});



},{"./modal-view":24}],23:[function(require,module,exports){
var ModalDialog, Tab, TabInfo, a, div, li, ref, ul;

ModalDialog = React.createFactory(require('./modal-dialog-view'));

ref = React.DOM, div = ref.div, ul = ref.ul, li = ref.li, a = ref.a;

TabInfo = (function() {
  function TabInfo(settings) {
    if (settings == null) {
      settings = {};
    }
    this.label = settings.label, this.component = settings.component;
  }

  return TabInfo;

})();

Tab = React.createFactory(React.createClass({
  displayName: 'ModalTabbedDialogTab',
  clicked: function(e) {
    e.preventDefault();
    return this.props.onSelected(this.props.index);
  },
  render: function() {
    return li({
      className: (this.props.selected ? 'tab-selected' : ''),
      onClick: this.clicked
    }, this.props.label);
  }
}));

module.exports = React.createClass({
  displayName: 'ModalTabbedDialog',
  getInitialState: function() {
    return {
      selectedTabIndex: 0
    };
  },
  statics: {
    Tab: function(settings) {
      return new TabInfo(settings);
    }
  },
  selectedTab: function(index) {
    return this.setState({
      selectedTabIndex: index
    });
  },
  render: function() {
    var index, tab, tabs;
    tabs = (function() {
      var i, len, ref1, results;
      ref1 = this.props.tabs;
      results = [];
      for (index = i = 0, len = ref1.length; i < len; index = ++i) {
        tab = ref1[index];
        results.push(Tab({
          label: tab.label,
          key: index,
          index: index,
          selected: index === this.state.selectedTabIndex,
          onSelected: this.selectedTab
        }));
      }
      return results;
    }).call(this);
    return ModalDialog({
      title: this.props.title,
      close: this.props.close
    }, div({
      className: 'modal-dialog-workspace-tabs'
    }, ul({}, tabs)), div({
      className: 'modal-dialog-workspace-tab-component'
    }, (function() {
      var i, len, ref1, results;
      ref1 = this.props.tabs;
      results = [];
      for (index = i = 0, len = ref1.length; i < len; index = ++i) {
        tab = ref1[index];
        results.push(div({
          style: {
            display: index === this.state.selectedTabIndex ? 'block' : 'none'
          }
        }, tab.component));
      }
      return results;
    }).call(this)));
  }
});



},{"./modal-dialog-view":22}],24:[function(require,module,exports){
var div;

div = React.DOM.div;

module.exports = React.createClass({
  displayName: 'Modal',
  watchForEscape: function(e) {
    var base;
    if (e.keyCode === 27) {
      return typeof (base = this.props).close === "function" ? base.close() : void 0;
    }
  },
  componentDidMount: function() {
    return $(window).on('keyup', this.watchForEscape);
  },
  componentWillUnmount: function() {
    return $(window).off('keyup', this.watchForEscape);
  },
  render: function() {
    return div({
      className: 'modal'
    }, div({
      className: 'modal-background'
    }), div({
      className: 'modal-content'
    }, this.props.children));
  }
});



},{}],25:[function(require,module,exports){
var button, div, h2, input, label, optgroup, option, ref, select, tr;

ref = React.DOM, div = ref.div, h2 = ref.h2, label = ref.label, input = ref.input, select = ref.select, option = ref.option, optgroup = ref.optgroup, button = ref.button;

tr = require("../utils/translate");

module.exports = React.createClass({
  displayName: 'NodeEdit',
  changeTitle: function(e) {
    var base;
    return typeof (base = this.props).onNodeChanged === "function" ? base.onNodeChanged(this.props.node, e.target.value, this.props.node.image) : void 0;
  },
  changeImage: function(e) {
    var base;
    return typeof (base = this.props).onNodeChanged === "function" ? base.onNodeChanged(this.props.node, this.props.node.title, e.target.value) : void 0;
  },
  addRemote: function(e) {
    var img, ref1, src;
    src = $.trim(((ref1 = this.refs.remoteUrl) != null ? ref1.getDOMNode().value : void 0) || '');
    if (src.length > 0) {
      img = new Image;
      img.onload = (function(_this) {
        return function() {
          var base;
          return typeof (base = _this.props).onNodeChanged === "function" ? base.onNodeChanged(_this.props.node, _this.props.node.title, src) : void 0;
        };
      })(this);
      img.onerror = (function(_this) {
        return function() {
          alert("Sorry, could not load " + src);
          return _this.refs.remoteUrl.getDOMNode().focus();
        };
      })(this);
      return img.src = src;
    }
  },
  render: function() {
    var builtInNodes, droppedNodes, i, j, len, node, ref1, remoteNodes;
    builtInNodes = [];
    droppedNodes = [];
    remoteNodes = [];
    ref1 = this.props.protoNodes;
    for (i = j = 0, len = ref1.length; j < len; i = ++j) {
      node = ref1[i];
      if (!node.image.match(/^(https?|data):/)) {
        builtInNodes.push(node);
      } else if (node.image.match(/^data:/)) {
        droppedNodes.push(node);
      } else if (node.image.match(/^https?:/)) {
        remoteNodes.push(node);
      }
    }
    return div({
      className: 'node-edit-view'
    }, h2({}, this.props.node.title), div({
      className: 'edit-row'
    }, label({
      htmlFor: 'title'
    }, tr("~NODE-EDIT.TITLE")), input({
      type: 'text',
      name: 'title',
      value: this.props.node.title,
      onChange: this.changeTitle
    })), div({
      className: 'edit-row'
    }, label({
      htmlFor: 'image'
    }, tr("~NODE-EDIT.IMAGE")), select({
      name: 'image',
      value: this.props.node.image,
      onChange: this.changeImage
    }, optgroup({
      label: tr("~NODE-EDIT.BUILT_IN")
    }, (function() {
      var k, len1, results;
      results = [];
      for (i = k = 0, len1 = builtInNodes.length; k < len1; i = ++k) {
        node = builtInNodes[i];
        results.push(option({
          key: i,
          value: node.image
        }, node.title.length > 0 ? node.title : '(none)'));
      }
      return results;
    })()), droppedNodes.length > 0 ? optgroup({
      label: tr("~NODE-EDIT.DROPPED")
    }, (function() {
      var k, len1, results;
      results = [];
      for (i = k = 0, len1 = droppedNodes.length; k < len1; i = ++k) {
        node = droppedNodes[i];
        results.push(option({
          key: i,
          value: node.image
        }, node.title || node.image));
      }
      return results;
    })()) : void 0, optgroup({
      label: 'Remote'
    }, (function() {
      var k, len1, results;
      results = [];
      for (i = k = 0, len1 = remoteNodes.length; k < len1; i = ++k) {
        node = remoteNodes[i];
        results.push(option({
          key: i,
          value: node.image
        }, node.image));
      }
      return results;
    })(), option({
      key: i,
      value: '#remote'
    }, tr("~NODE-EDIT.ADD_REMOTE"))))), this.props.node.image === '#remote' ? div({}, div({
      className: 'edit-row'
    }, label({
      htmlFor: 'remoteUrl'
    }, 'URL'), input({
      type: 'text',
      ref: 'remoteUrl',
      name: 'remoteUrl',
      placeholder: 'Remote image url'
    })), div({
      className: 'edit-row'
    }, label({
      htmlFor: 'save'
    }, ''), button({
      name: 'save',
      onClick: this.addRemote
    }, 'Add Remote Image'))) : void 0);
  }
});



},{"../utils/translate":14}],26:[function(require,module,exports){
var div, i, img, ref;

ref = React.DOM, div = ref.div, i = ref.i, img = ref.img;

module.exports = React.createClass({
  displayName: 'NodeView',
  componentDidMount: function() {
    var $elem;
    $elem = $(this.refs.node.getDOMNode());
    $elem.draggable({
      drag: this.doMove,
      containment: 'parent'
    });
    return $elem.bind('mouseup touchend', ((function(_this) {
      return function() {
        return _this.handleSelected(true);
      };
    })(this)));
  },
  handleSelected: function(actually_select) {
    var selectionKey;
    if (this.props.linkManager) {
      selectionKey = actually_select ? this.props.nodeKey : 'dont-select-anything';
      return this.props.linkManager.selectNode(selectionKey);
    }
  },
  propTypes: {
    onDelete: React.PropTypes.func,
    onMove: React.PropTypes.func,
    onSelect: React.PropTypes.func,
    nodeKey: React.PropTypes.string
  },
  getDefaultProps: function() {
    return {
      onMove: function() {
        return log.info('internal move handler');
      },
      onStop: function() {
        return log.info('internal move handler');
      },
      onDelete: function() {
        return log.info('internal on-delete handler');
      },
      onSelect: function() {
        return log.info('internal select handler');
      }
    };
  },
  doMove: function(evt, extra) {
    return this.props.onMove({
      nodeKey: this.props.nodeKey,
      reactComponent: this,
      domElement: this.refs.node.getDOMNode(),
      syntheticEvent: evt,
      extra: extra
    });
  },
  doDelete: function(evt) {
    return this.props.onDelete({
      nodeKey: this.props.nodeKey,
      reactComponent: this,
      domElement: this.refs.node.getDOMNode(),
      syntheticEvent: evt
    });
  },
  render: function() {
    var ref1, style;
    style = {
      top: this.props.data.y,
      left: this.props.data.x
    };
    return div({
      className: "elm" + (this.props.selected ? ' selected' : ''),
      ref: 'node',
      style: style,
      'data-node-key': this.props.nodeKey
    }, div({
      className: 'img-background'
    }, div({
      className: 'delete-box',
      onClick: this.doDelete
    }, i({
      className: 'fa fa-times-circle'
    })), (((ref1 = this.props.data.image) != null ? ref1.length : void 0) > 0 && this.props.data.image !== '#remote' ? img({
      src: this.props.data.image
    }) : null), div({
      className: 'node-title'
    }, this.props.data.title)));
  }
});



},{}],27:[function(require,module,exports){
var ProtoNodeView, div;

ProtoNodeView = React.createFactory(require('./proto-node-view'));

div = React.DOM.div;

module.exports = React.createClass({
  displayName: 'NodeWell',
  getInitialState: function() {
    return {
      nodes: [],
      collapsed: true
    };
  },
  collapse: function() {
    return this.setState({
      collapsed: true
    });
  },
  expand: function() {
    return this.setState({
      collapsed: false
    });
  },
  toggle: function() {
    if (this.state.collapsed) {
      return this.expand();
    } else {
      return this.collapse();
    }
  },
  render: function() {
    var i, node, topNodePaletteClass, topNodeTabPaletteClass;
    topNodePaletteClass = 'top-node-palette';
    topNodeTabPaletteClass = 'top-node-palette-tab';
    if (this.state.collapsed) {
      topNodePaletteClass = 'top-node-palette collapsed';
      topNodeTabPaletteClass = 'top-node-palette-tab collapsed';
    }
    return div({
      className: 'top-node-palette-wrapper'
    }, div({
      className: topNodePaletteClass
    }, div({
      className: 'node-well'
    }, (function() {
      var j, len, ref, results;
      ref = this.props.protoNodes;
      results = [];
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        node = ref[i];
        results.push(ProtoNodeView({
          key: i,
          image: node.image,
          title: node.title
        }));
      }
      return results;
    }).call(this))), div({
      className: topNodeTabPaletteClass,
      onClick: this.toggle
    }));
  }
});



},{"./proto-node-view":30}],28:[function(require,module,exports){
var PaletteImage, ProtoNodeView, div, i, img, ref, span, tr;

ProtoNodeView = React.createFactory(require('./proto-node-view'));

tr = require("../utils/translate");

ref = React.DOM, div = ref.div, img = ref.img, i = ref.i, span = ref.span;

PaletteImage = React.createFactory(React.createClass({
  displayName: 'PaletteImage',
  clicked: function() {
    return this.props.onSelect(this.props.index);
  },
  render: function() {
    return div({
      className: 'palette-image'
    }, ProtoNodeView({
      key: this.props.index,
      image: this.props.node.image,
      title: this.props.node.title,
      onNodeClicked: this.clicked
    }), div({
      className: 'palette-image-selected'
    }, this.props.selected ? i({
      className: "fa fa-check-circle"
    }) : ''));
  }
}));

module.exports = React.createClass({
  displayName: 'PaletteInspector',
  getInitialState: function() {
    return {
      selectedIndex: _.findIndex(this.props.protoNodes, function(node) {
        return node.image.length > 0;
      })
    };
  },
  imageSelected: function(index) {
    return this.setState({
      selectedIndex: index
    });
  },
  scrollToBottom: function() {
    var palette, ref1;
    palette = (ref1 = this.refs.palette) != null ? ref1.getDOMNode() : void 0;
    if (palette) {
      return palette.scrollTop = palette.scrollHeight;
    }
  },
  componentDidMount: function() {
    return this.scrollToBottom();
  },
  componentDidUpdate: function(prevProps) {
    if (JSON.stringify(prevProps.protoNodes) !== JSON.stringify(this.props.protoNodes)) {
      return this.scrollToBottom();
    }
  },
  render: function() {
    var index, node;
    return div({
      className: 'palette-inspector'
    }, div({
      className: 'palette',
      ref: 'palette'
    }, div({}, (function() {
      var j, len, ref1, results;
      ref1 = this.props.protoNodes;
      results = [];
      for (index = j = 0, len = ref1.length; j < len; index = ++j) {
        node = ref1[index];
        if (node.image) {
          results.push(PaletteImage({
            node: node,
            index: index,
            selected: index === this.state.selectedIndex,
            onSelect: this.imageSelected
          }));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }).call(this), div({
      className: 'palette-add-image',
      onClick: this.props.toggleImageBrowser
    }, i({
      className: "fa fa-plus-circle"
    }), 'Add new image'))), div({
      className: 'palette-about-image'
    }, div({
      className: 'palette-about-image-title'
    }, i({
      className: "fa fa-info-circle"
    }), span({}, 'About This Image'), img({
      src: this.props.protoNodes[this.state.selectedIndex].image
    })), div({
      className: 'palette-about-image-info'
    }, 'TBD')));
  }
});



},{"../utils/translate":14,"./proto-node-view":30}],29:[function(require,module,exports){
var div;

div = React.DOM.div;

module.exports = React.createClass({
  displayName: 'Placeholder',
  render: function() {
    return div({
      className: "placeholder " + this.props.className
    }, div({
      className: 'placeholder-content'
    }, this.props.label));
  }
});



},{}],30:[function(require,module,exports){
var div, img, ref;

ref = React.DOM, div = ref.div, img = ref.img;

module.exports = React.createClass({
  displayName: 'ProtoNode',
  componentDidMount: function() {
    return $(this.refs.node.getDOMNode()).draggable({
      drag: this.doMove,
      revert: true,
      helper: 'clone',
      revertDuration: 0,
      opacity: 0.35,
      appendTo: 'body',
      zIndex: 1000
    });
  },
  doMove: function() {
    return void 0;
  },
  onClick: function() {
    var base;
    return typeof (base = this.props).onNodeClicked === "function" ? base.onNodeClicked(this.props.image) : void 0;
  },
  render: function() {
    var defaultImage, imageUrl, ref1;
    defaultImage = "img/nodes/blank.png";
    imageUrl = ((ref1 = this.props.image) != null ? ref1.length : void 0) > 0 ? this.props.image : defaultImage;
    return div({
      className: 'proto-node',
      ref: 'node',
      onClick: this.onClick,
      'data-node-key': this.props.key,
      'data-image': this.props.image,
      'data-title': this.props.title
    }, div({
      className: 'img-background'
    }, img({
      src: imageUrl
    })));
  }
});



},{}],31:[function(require,module,exports){
module.exports = [
  {
    "id": "1",
    "title": "",
    "image": ""
  }, {
    "id": "2",
    "title": "Egg",
    "image": "img/nodes/egg.png"
  }, {
    "id": "3",
    "title": "Chick",
    "image": "img/nodes/chick.jpg"
  }, {
    "id": "4",
    "title": "Chicken",
    "image": "img/nodes/chicken.jpg"
  }
];



},{}]},{},[1]);
