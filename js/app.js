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



},{"./models/link-manager":5,"./views/app-view":18}],2:[function(require,module,exports){
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
        if (node.metadata) {
          this.props.linkManager.setImageMetadata(node.image, node.metadata);
        }
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
      this.props.linkManager.loadData(JSON.parse(this.props.data));
    } else {
      this.props.linkManager.loadDataFromUrl(this.props.url);
    }
    return ($(window)).on('keyup', (function(_this) {
      return function(e) {
        var y, z;
        y = e.keyCode === 89;
        z = e.keyCode === 90;
        if (e.ctrlKey && (y || z)) {
          e.preventDefault();
          if (y) {
            _this.props.linkManager.redo();
          }
          if (z) {
            return _this.props.linkManager.undo();
          }
        }
      };
    })(this));
  },
  componentDidUnmount: function() {
    return this.addDeleteKeyHandler(false);
  },
  getData: function() {
    return this.props.linkManager.toJsonString(this.state.protoNodes);
  },
  onNodeChanged: function(node, data) {
    return this.props.linkManager.changeNode(data);
  },
  onNodeDelete: function() {
    return this.props.linkManager.deleteSelected();
  },
  onLinkChanged: function(link, title, color, deleted) {
    return this.props.linkManager.changeLink(title, color, deleted);
  }
};



},{"../views/proto-nodes":39}],3:[function(require,module,exports){
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
            _this.setState({
              fileId: fileSpec.id,
              action: null
            });
            return _this.props.linkManager.setSaved();
          }
        };
      })(this));
    }
  }
};



},{"../utils/google-drive-io":10}],4:[function(require,module,exports){
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
var DiagramNode, Importer, Link, LinkManager, UndoRedo,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Importer = require('../utils/importer');

Link = require('./link');

DiagramNode = require('./node');

UndoRedo = require('../utils/undo-redo');

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
    this.imageMetadataCache = {};
    this.undoRedoManager = new UndoRedo.Manager({
      debug: true
    });
  }

  LinkManager.prototype.undo = function() {
    return this.undoRedoManager.undo();
  };

  LinkManager.prototype.redo = function() {
    return this.undoRedoManager.redo();
  };

  LinkManager.prototype.setSaved = function() {
    return this.undoRedoManager.save();
  };

  LinkManager.prototype.addChangeListener = function(listener) {
    log.info("adding change listener");
    return this.undoRedoManager.addChangeListener(listener);
  };

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
    return this.undoRedoManager.createAndExecuteCommand('addLink', {
      execute: (function(_this) {
        return function() {
          return _this._addLink(link);
        };
      })(this),
      undo: (function(_this) {
        return function() {
          return _this._removeLink(link);
        };
      })(this)
    });
  };

  LinkManager.prototype._addLink = function(link) {
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

  LinkManager.prototype.removeLink = function(link) {
    return this.undoRedoManager.createAndExecuteCommand('removeLink', {
      execute: (function(_this) {
        return function() {
          return _this._removeLink(link);
        };
      })(this),
      undo: (function(_this) {
        return function() {
          return _this._addLink(link);
        };
      })(this)
    });
  };

  LinkManager.prototype._removeLink = function(link) {
    var i, len, listener, ref, ref1, ref2, results;
    delete this.linkKeys[link.terminalKey()];
    if ((ref = this.nodeKeys[link.sourceNode.key]) != null) {
      ref.removeLink(link);
    }
    if ((ref1 = this.nodeKeys[link.targetNode.key]) != null) {
      ref1.removeLink(link);
    }
    ref2 = this.linkListeners;
    results = [];
    for (i = 0, len = ref2.length; i < len; i++) {
      listener = ref2[i];
      log.info("notifying of deleted Link");
      results.push(listener.handleLinkRm(link));
    }
    return results;
  };

  LinkManager.prototype.importNode = function(nodeSpec) {
    var node;
    node = new DiagramNode(nodeSpec.data, nodeSpec.key);
    return this.addNode(node);
  };

  LinkManager.prototype.addNode = function(node) {
    return this.undoRedoManager.createAndExecuteCommand('addNode', {
      execute: (function(_this) {
        return function() {
          return _this._addNode(node);
        };
      })(this),
      undo: (function(_this) {
        return function() {
          return _this._removeNode(node);
        };
      })(this)
    });
  };

  LinkManager.prototype.removeNode = function(nodeKey) {
    var links, node;
    node = this.nodeKeys[nodeKey];
    links = node.links.slice();
    return this.undoRedoManager.createAndExecuteCommand('removeNode', {
      execute: (function(_this) {
        return function() {
          var i, len, link;
          for (i = 0, len = links.length; i < len; i++) {
            link = links[i];
            _this._removeLink(link);
          }
          return _this._removeNode(node);
        };
      })(this),
      undo: (function(_this) {
        return function() {
          var i, len, link, results;
          _this._addNode(node);
          results = [];
          for (i = 0, len = links.length; i < len; i++) {
            link = links[i];
            results.push(_this._addLink(link));
          }
          return results;
        };
      })(this)
    });
  };

  LinkManager.prototype._addNode = function(node) {
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

  LinkManager.prototype._removeNode = function(node) {
    var i, j, len, len1, listener, ref, ref1, results;
    delete this.nodeKeys[node.key];
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

  LinkManager.prototype.moveNodeCompleted = function(nodeKey, pos, originalPos) {
    var node;
    node = this.nodeKeys[nodeKey];
    if (!node) {
      return;
    }
    return this.undoRedoManager.createAndExecuteCommand('moveNode', {
      execute: (function(_this) {
        return function() {
          return _this.moveNode(node.key, pos, originalPos);
        };
      })(this),
      undo: (function(_this) {
        return function() {
          return _this.moveNode(node.key, originalPos, pos);
        };
      })(this)
    });
  };

  LinkManager.prototype.moveNode = function(nodeKey, pos, originalPos) {
    var i, len, listener, node, ref, results;
    node = this.nodeKeys[nodeKey];
    if (!node) {
      return;
    }
    node.x = pos.left;
    node.y = pos.top;
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

  LinkManager.prototype.changeNode = function(data) {
    var node, originalData;
    if (this.selectedNode) {
      node = this.selectedNode;
      originalData = {
        title: node.title,
        image: node.image,
        color: node.color
      };
      return this.undoRedoManager.createAndExecuteCommand('changeNode', {
        execute: (function(_this) {
          return function() {
            return _this._changeNode(node, data);
          };
        })(this),
        undo: (function(_this) {
          return function() {
            return _this._changeNode(node, originalData);
          };
        })(this)
      });
    }
  };

  LinkManager.prototype._changeNode = function(node, data) {
    var i, j, key, len, len1, listener, ref, ref1, results;
    log.info("Change for " + node.title);
    ref = ['title', 'image', 'color'];
    for (i = 0, len = ref.length; i < len; i++) {
      key = ref[i];
      if (data[key]) {
        log.info("Change " + key + " for " + node.title);
        node[key] = data[key];
      }
    }
    ref1 = this.selectionListeners;
    results = [];
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      listener = ref1[j];
      results.push(listener({
        node: node,
        connection: null
      }));
    }
    return results;
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
    var link, originalColor, originalTitle;
    if (deleted) {
      return this.removeSelectedLink();
    } else if (this.selectedLink) {
      link = this.selectedLink;
      originalTitle = this.selectedLink.title;
      originalColor = this.selectedLink.color;
      return this.undoRedoManager.createAndExecuteCommand('changeLink', {
        execute: (function(_this) {
          return function() {
            return _this._changeLink(link, title, color);
          };
        })(this),
        undo: (function(_this) {
          return function() {
            return _this._changeLink(link, originalTitle, originalColor);
          };
        })(this)
      });
    }
  };

  LinkManager.prototype._changeLink = function(link, title, color) {
    var i, len, listener, ref, results;
    log.info("Change  for " + link.title);
    link.title = title;
    link.color = color;
    ref = this.selectionListeners;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      listener = ref[i];
      results.push(listener({
        node: null,
        connection: link
      }));
    }
    return results;
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

  LinkManager.prototype.deleteAll = function() {
    var node;
    for (node in this.nodeKeys) {
      this.removeNode(node);
    }
    this.setFilename('New Model');
    return this.undoRedoManager.clearHistory();
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
    var i, len, listener, ref, results;
    if (this.selectedLink) {
      this.removeLink(this.selectedLink);
      this.selectedLink = null;
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

  LinkManager.prototype.removeLinksForNode = function(node) {
    var i, len, link, ref, results;
    ref = node.links;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      link = ref[i];
      results.push(this.removeLink(link));
    }
    return results;
  };

  LinkManager.prototype.loadData = function(data) {
    var i, importer, len, listener, ref;
    log.info("json success");
    importer = new Importer(this);
    importer.importData(data);
    this.setFilename(data.filename || 'New Model');
    if (data.imageMetadata) {
      _.forEach(data.imageMetadata, (function(_this) {
        return function(metadata, image) {
          return _this.setImageMetadata(image, metadata);
        };
      })(this));
    }
    ref = this.loadListeners;
    for (i = 0, len = ref.length; i < len; i++) {
      listener = ref[i];
      listener(data);
    }
    return this.undoRedoManager.clearHistory();
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
    var imageMetadata, key, link, linkExports, node, nodeExports;
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
    imageMetadata = {};
    _.forEach(palette, (function(_this) {
      return function(node) {
        if (_this.imageMetadataCache[node.image]) {
          return imageMetadata[node.image] = _this.imageMetadataCache[node.image];
        }
      };
    })(this));
    return {
      version: 0.1,
      filename: this.filename,
      palette: palette,
      nodes: nodeExports,
      links: linkExports,
      imageMetadata: imageMetadata
    };
  };

  LinkManager.prototype.toJsonString = function(palette) {
    return JSON.stringify(this.serialize(palette));
  };

  LinkManager.prototype.setImageMetadata = function(image, metadata) {
    return this.imageMetadataCache[image] = metadata;
  };

  LinkManager.prototype.getImageMetadata = function(image) {
    return this.imageMetadataCache[image];
  };

  return LinkManager;

})();



},{"../utils/importer":11,"../utils/undo-redo":17,"./link":6,"./node":7}],6:[function(require,module,exports){
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
var Colors, GraphPrimitive, Node, tr,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

GraphPrimitive = require('./graph-primitive');

Colors = require('../utils/colors');

tr = require('../utils/translate');

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
    this.color = nodeSpec.color || Colors[0].value;
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

  Node.prototype.removeLink = function(link) {
    if (link.sourceNode === this || link.targetNode === this) {
      return _.remove(this.links, function(testLink) {
        return testLink === link;
      });
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



},{"../utils/colors":8,"../utils/translate":16,"./graph-primitive":4}],8:[function(require,module,exports){
var tr;

tr = require('./translate');

module.exports = [
  {
    name: tr("~COLOR.YELLOW"),
    value: "#f7be33"
  }, {
    name: tr("~COLOR.DARK_BLUE"),
    value: "#105262"
  }, {
    name: tr("~COLOR.MED_BLUE"),
    value: "#72c0cc"
  }
];



},{"./translate":16}],9:[function(require,module,exports){
var resizeImage;

resizeImage = require('./resize-image');

module.exports = function(e, callback) {
  var file, i, len, reader, ref, results, url;
  if (e.dataTransfer.files.length > 0) {
    ref = e.dataTransfer.files;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      file = ref[i];
      if (/^image\//.test(file.type)) {
        reader = new FileReader();
        reader.addEventListener('loadend', function(e) {
          return resizeImage(e.target.result, function(dataUrl) {
            return callback({
              name: file.name,
              title: (file.name.split('.'))[0],
              image: dataUrl
            });
          });
        });
        results.push(reader.readAsDataURL(file));
      } else {
        results.push(void 0);
      }
    }
    return results;
  } else {
    url = e.dataTransfer.getData('URL');
    return callback({
      name: '',
      title: '',
      image: url
    });
  }
};



},{"./resize-image":15}],10:[function(require,module,exports){
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



},{}],11:[function(require,module,exports){
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



},{}],12:[function(require,module,exports){
var DiagramToolkit;

module.exports = DiagramToolkit = (function() {
  function DiagramToolkit(domContext, options) {
    this.domContext = domContext;
    this.options = options != null ? options : {};
    this.type = 'jsPlumbWrappingDiagramToolkit';
    this.color = this.options.color || '#233';
    this.lineWidth = this.options.lineWidth || 1;
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
      paintStyle.outlineColor = "#f6bf33";
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



},{}],13:[function(require,module,exports){
module.exports = {
  "~MENU.SAVE": "Save …",
  "~MENU.OPEN": "Open …",
  "~MENU.NEW": "New …",
  "~MENU.SAVE_AS": "Save as …",
  "~MENU.SETTINGS": "Advanced Settings …",
  "~NODE-EDIT.TITLE": "Name",
  "~NODE-EDIT.COLOR": "Color",
  "~NODE-EDIT.IMAGE": "Image",
  "~NODE-EDIT.BUILT_IN": "Built-In",
  "~NODE-EDIT.DROPPED": "Dropped",
  "~NODE-EDIT.REMOTE": "Remote",
  "~NODE-EDIT.ADD_REMOTE": "Add remote",
  "~NODE-EDIT.DELETE": "✖ Delete Component",
  "~LINK-EDIT.DELETE": "✖ Delete Link",
  "~LINK-EDIT.TITLE": "Title",
  "~LINK-EDIT.COLOR": "Color",
  "~ADD-NEW-IMAGE.TITLE": "Add new image",
  "~ADD-NEW-IMAGE.IMAGE-SEARCH-TAB": "Image Search",
  "~ADD-NEW-IMAGE.MY-COMPUTER-TAB": "My Computer",
  "~ADD-NEW-IMAGE.LINK-TAB": "Link",
  "~PALETTE-INSPECTOR.ADD_IMAGE": "Add new image",
  "~PALETTE-INSPECTOR.ABOUT_IMAGE": "About This Image",
  "~METADATA.TITLE": "Title",
  "~METADATA.DESCRIPTION": "Description",
  "~METADATA.LINK": "Link",
  "~IMAGE-BROWSER.PREVIEW": "Preview Your Image",
  "~IMAGE-BROWSER.ADD_IMAGE": "Add Image",
  "~IMAGE-BROWSER.SEARCH_HEADER": "Search for images",
  "~IMAGE-BROWSER.NO_IMAGES_FOUND": "Sorry, no images found.",
  "~IMAGE-BROWSER.TRY_ANOTHER_SEARCH": "Try another search, or browse images below.",
  "~IMAGE-BROWSER.LIBRARY_HEADER": "Internal Library Images",
  "~IMAGE-BROWSER.NO_INTERNAL_FOUND": "No internal library results found for '%{query}'",
  "~IMAGE-BROWSER.SEARCHING": "Searching for %{scope}'%{query}'...",
  "~IMAGE-BROWSER.NO_EXTERNAL_FOUND": "No openclipart.org results found for '%{query}'",
  "~IMAGE-BROWSER.SHOWING_N_OF_M": "Showing %{numResults} of %{numTotalResults} matches for '%{query}'. ",
  "~IMAGE-BROWSER.SHOW_ALL": "Show all matches.",
  "~COLOR.YELLOW": "Yellow",
  "~COLOR.DARK_BLUE": "Dark Blue",
  "~COLOR.LIGHT_BLUE": "Light Blue",
  "~COLOR.MED_BLUE": "Blue"
};



},{}],14:[function(require,module,exports){
var OpenClipArt, initialResultSize;

initialResultSize = 12;

module.exports = OpenClipArt = {
  jqXHR: null,
  search: function(query, options, callback) {
    var ref, url;
    if ((ref = OpenClipArt.jqXHR) != null) {
      ref.abort();
    }
    url = "https://openclipart.org/search/json/?query=" + (encodeURIComponent(query)) + "&sort=downloads&amount=" + (options.limitResults ? initialResultSize : 200);
    return OpenClipArt.jqXHR = $.getJSON(url, function(data) {
      var i, item, len, numMatches, ref1, ref2, results;
      results = [];
      numMatches = Math.min(parseInt((data != null ? (ref1 = data.info) != null ? ref1.results : void 0 : void 0) || '0', 10), 200);
      ref2 = data != null ? data.payload : void 0;
      for (i = 0, len = ref2.length; i < len; i++) {
        item = ref2[i];
        results.push({
          image: item.svg.png_thumb,
          metadata: {
            title: item.title,
            description: item.description,
            link: item.detail_link
          }
        });
      }
      return callback(results, numMatches);
    });
  }
};



},{}],15:[function(require,module,exports){
module.exports = function(src, callback) {
  var img, maxHeight, maxWidth;
  maxWidth = 100;
  maxHeight = 100;
  img = document.createElement('img');
  img.setAttribute('crossOrigin', 'anonymous');
  img.src = src;
  return img.onload = function() {
    var canvas, height, width;
    canvas = document.createElement('canvas');
    width = img.width, height = img.height;
    if (width > height) {
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width *= maxHeight / height;
        height = maxHeight;
      }
    }
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    return callback(canvas.toDataURL('image/png'));
  };
};



},{}],16:[function(require,module,exports){
var defaultLang, translate, translations, varRegExp;

translations = {};

translations['en'] = require('./lang/us-en');

defaultLang = 'en';

varRegExp = /%\{\s*([^}\s]*)\s*\}/g;

translate = function(key, vars, lang) {
  var ref, translation;
  if (vars == null) {
    vars = {};
  }
  if (lang == null) {
    lang = defaultLang;
  }
  translation = ((ref = translations[lang]) != null ? ref[key] : void 0) || key;
  return translation.replace(varRegExp, function(match, key) {
    if (vars.hasOwnProperty(key)) {
      return vars[key];
    } else {
      return "'** UKNOWN KEY: " + key + " **";
    }
  });
};

module.exports = translate;



},{"./lang/us-en":13}],17:[function(require,module,exports){
var Command, Manager;

Manager = (function() {
  function Manager(options) {
    if (options == null) {
      options = {};
    }
    this.debug = options.debug;
    this.commands = [];
    this.stackPosition = -1;
    this.savePosition = -1;
    this.changeListeners = [];
  }

  Manager.prototype.createAndExecuteCommand = function(name, methods) {
    return this.execute(new Command(name, methods));
  };

  Manager.prototype.execute = function(command) {
    var result;
    this._clearRedo();
    result = command.execute(this.debug);
    this.commands.push(command);
    this.stackPosition++;
    this._changed();
    if (this.debug) {
      this.log();
    }
    return result;
  };

  Manager.prototype.undo = function() {
    var result;
    if (this.canUndo()) {
      result = this.commands[this.stackPosition].undo(this.debug);
      this.stackPosition--;
      this._changed();
      if (this.debug) {
        this.log();
      }
      return result;
    } else {
      return false;
    }
  };

  Manager.prototype.canUndo = function() {
    return this.stackPosition >= 0;
  };

  Manager.prototype.redo = function() {
    var result;
    if (this.canRedo()) {
      this.stackPosition++;
      result = this.commands[this.stackPosition].redo(this.debug);
      this._changed();
      if (this.debug) {
        this.log();
      }
      return result;
    } else {
      return false;
    }
  };

  Manager.prototype.canRedo = function() {
    return this.stackPosition < this.commands.length - 1;
  };

  Manager.prototype.save = function() {
    this.savePosition = this.stackPosition;
    return this._changed();
  };

  Manager.prototype.clearHistory = function() {
    this.commands = [];
    this.stackPosition = -1;
    this.savePosition = -1;
    this._changed();
    if (this.debug) {
      return this.log();
    }
  };

  Manager.prototype.dirty = function() {
    return this.stackPosition !== this.savePosition;
  };

  Manager.prototype.addChangeListener = function(listener) {
    return this.changeListeners.push(listener);
  };

  Manager.prototype.log = function() {
    log.info("Undo Stack: [" + ((_.pluck(this.commands.slice(0, this.stackPosition + 1), 'name')).join(', ')) + "]");
    return log.info("Redo Stack: [" + ((_.pluck(this.commands.slice(this.stackPosition + 1), 'name')).join(', ')) + "]");
  };

  Manager.prototype._clearRedo = function() {
    return this.commands = this.commands.slice(0, this.stackPosition + 1);
  };

  Manager.prototype._changed = function() {
    var i, len, listener, ref, results, status;
    if (this.changeListeners.length > 0) {
      status = {
        dirty: this.dirty(),
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      };
      ref = this.changeListeners;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        listener = ref[i];
        results.push(listener(status));
      }
      return results;
    }
  };

  return Manager;

})();

Command = (function() {
  function Command(name1, methods1) {
    this.name = name1;
    this.methods = methods1;
    void 0;
  }

  Command.prototype._call = function(method, debug, via) {
    if (debug) {
      log.info("Command: " + this.name + "." + method + "()" + (via ? " via " + via : ''));
    }
    if (this.methods.hasOwnProperty(method)) {
      return this.methods[method]();
    } else {
      throw new Error("Undefined " + method + " method for " + this.name + " command");
    }
  };

  Command.prototype.execute = function(debug) {
    return this._call('execute', debug);
  };

  Command.prototype.undo = function(debug) {
    return this._call('undo', debug);
  };

  Command.prototype.redo = function(debug) {
    return this._call('execute', debug, 'redo');
  };

  return Command;

})();

module.exports = {
  Manager: Manager,
  Command: Command
};



},{}],18:[function(require,module,exports){
var DocumentActions, GlobalNav, ImageBrowser, InspectorPanel, LinkView, NodeWell, Placeholder, a, div, ref;

Placeholder = React.createFactory(require('./placeholder-view'));

GlobalNav = React.createFactory(require('./global-nav-view'));

LinkView = React.createFactory(require('./link-view'));

NodeWell = React.createFactory(require('./node-well-view'));

InspectorPanel = React.createFactory(require('./inspector-panel-view'));

ImageBrowser = React.createFactory(require('./image-browser-view'));

DocumentActions = React.createFactory(require('./document-actions-view'));

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
    }), DocumentActions({
      linkManager: this.props.linkManager
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
      onNodeDelete: this.onNodeDelete,
      protoNodes: this.state.protoNodes,
      toggleImageBrowser: this.toggleImageBrowser,
      linkManager: this.props.linkManager
    }), this.state.showImageBrowser ? ImageBrowser({
      protoNodes: this.state.protoNodes,
      addToPalette: this.addToPalette,
      close: this.toggleImageBrowser
    }) : void 0));
  }
});



},{"../mixins/app-view":2,"./document-actions-view":20,"./global-nav-view":22,"./image-browser-view":23,"./inspector-panel-view":26,"./link-view":29,"./node-well-view":35,"./placeholder-view":37}],19:[function(require,module,exports){
var ColorChoice, Colors, div, tr;

div = React.DOM.div;

tr = require('../utils/translate');

Colors = require('../utils/colors');

ColorChoice = React.createFactory(React.createClass({
  displayName: 'ColorChoice',
  selectColor: function() {
    return this.props.onChange(this.props.color);
  },
  render: function() {
    var className, name, value;
    name = this.props.color.name;
    value = this.props.color.value;
    className = 'color-choice';
    if (this.props.selected === value) {
      className = 'color-choice selected';
    }
    return div({
      className: className,
      onClick: this.selectColor
    }, div({
      className: 'color-swatch',
      style: {
        'background-color': value
      }
    }), div({
      className: 'color-label'
    }, name));
  }
}));

module.exports = React.createClass({
  displayName: 'ColorPickerView',
  getInitialState: function() {
    return {
      opened: false
    };
  },
  select: function(color) {
    return this.props.onChange(color.value);
  },
  toggleOpen: function() {
    return this.setState({
      opened: !this.state.opened
    });
  },
  className: function() {
    if (this.state.opened) {
      return "color-picker opened";
    } else {
      return "color-picker closed";
    }
  },
  render: function() {
    var color;
    return div({
      className: this.className(),
      onClick: this.toggleOpen
    }, (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = Colors.length; i < len; i++) {
        color = Colors[i];
        results.push(ColorChoice({
          color: color,
          selected: this.props.selected,
          onChange: this.select
        }));
      }
      return results;
    }).call(this));
  }
});



},{"../utils/colors":8,"../utils/translate":16}],20:[function(require,module,exports){
var div, ref, span;

ref = React.DOM, div = ref.div, span = ref.span;

module.exports = React.createClass({
  displayName: 'DocumentActions',
  getInitialState: function() {
    return {
      canRedo: false,
      canUndo: false
    };
  },
  componentDidMount: function() {
    return this.props.linkManager.addChangeListener(this.modelChanged);
  },
  modelChanged: function(status) {
    return this.setState({
      canRedo: status.canRedo,
      canUndo: status.canUndo
    });
  },
  undoClicked: function() {
    return this.props.linkManager.undo();
  },
  redoClicked: function() {
    return this.props.linkManager.redo();
  },
  render: function() {
    var buttonClass;
    buttonClass = function(enabled) {
      return "button-link " + (!enabled ? 'disabled' : '');
    };
    return div({
      className: 'document-actions'
    }, div({
      className: 'undo-redo'
    }, span({
      className: buttonClass(this.state.canUndo),
      onClick: this.undoClicked,
      disabled: !this.state.canUndo
    }, 'Undo'), span({
      className: buttonClass(this.state.canRedo),
      onClick: this.redoClicked,
      disabled: !this.state.canRedo
    }, 'Redo')));
  }
});



},{}],21:[function(require,module,exports){
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



},{}],22:[function(require,module,exports){
var Dropdown, div, i, ref, span, tr;

ref = React.DOM, div = ref.div, i = ref.i, span = ref.span;

tr = require('../utils/translate');

Dropdown = React.createFactory(require('./dropdown-view'));

module.exports = React.createClass({
  displayName: 'GlobalNav',
  mixins: [require('../mixins/google-file-interface')],
  getInitialState: function() {
    return this.getInitialAppViewState({
      dirty: false
    });
  },
  componentDidMount: function() {
    this.createGoogleDrive();
    return this.props.linkManager.addChangeListener(this.modelChanged);
  },
  modelChanged: function(status) {
    return this.setState({
      dirty: status.dirty
    });
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
      className: 'global-nav'
    }, div({}, Dropdown({
      anchor: this.props.filename,
      items: options,
      className: 'global-nav-content-filename'
    }), this.state.dirty ? span({
      className: 'global-nav-file-status'
    }, 'Unsaved') : void 0), this.state.action ? div({}, i({
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



},{"../mixins/google-file-interface":3,"../utils/translate":16,"./dropdown-view":21}],23:[function(require,module,exports){
var ImageMetadata, ImageSearch, ImageSearchResult, Link, ModalTabbedDialog, ModalTabbedDialogFactory, MyComputer, OpenClipart, PreviewImage, a, br, button, div, form, i, img, input, ref, resizeImage, tr;

ModalTabbedDialog = require('./modal-tabbed-dialog-view');

ModalTabbedDialogFactory = React.createFactory(ModalTabbedDialog);

ImageMetadata = React.createFactory(require('./image-metadata-view'));

OpenClipart = require('../utils/open-clipart');

tr = require('../utils/translate');

resizeImage = require('../utils/resize-image');

ref = React.DOM, div = ref.div, input = ref.input, button = ref.button, img = ref.img, i = ref.i, a = ref.a, form = ref.form, br = ref.br;

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
    }, tr('~IMAGE-BROWSER.PREVIEW')), div({
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
    }, tr('~IMAGE-BROWSER.ADD_IMAGE'))), this.props.imageInfo.metadata ? div({
      className: 'image-browser-preview-metadata'
    }, ImageMetadata({
      className: 'image-browser-preview-metadata',
      metadata: this.props.imageInfo.metadata
    })) : void 0);
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
  searchClicked: function(e) {
    e.preventDefault();
    return this.search({
      limitResults: true
    });
  },
  showAllMatches: function() {
    return this.search({
      limitResults: false
    });
  },
  search: function(options) {
    var internalResults, query, queryRegEx, validQuery;
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
    return OpenClipart.search(query, options, (function(_this) {
      return function(results, numMatches) {
        return _this.setState({
          searching: false,
          searched: true,
          externalResults: results,
          numExternalMatches: numMatches
        });
      };
    })(this));
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
      resizeImage(imageInfo.image, (function(_this) {
        return function(dataUrl) {
          imageInfo.image = dataUrl;
          return _this.props.addToPalette(imageInfo);
        };
      })(this));
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
    }, form({}, input({
      type: 'text',
      ref: 'search',
      placeholder: tr('~IMAGE-BROWSER.SEARCH_HEADER')
    }), input({
      type: 'submit',
      value: 'Search',
      onClick: this.searchClicked
    }))), showNoResultsAlert ? div({
      className: 'modal-dialog-alert'
    }, tr('~IMAGE-BROWSER.NO_IMAGES_FOUND'), br({}), tr('~IMAGE-BROWSER.TRY_ANOTHER_SEARCH')) : void 0, div({
      className: 'image-browser-header'
    }, tr('~IMAGE-BROWSER.LIBRARY_HEADER')), div({
      className: 'image-browser-results'
    }, (function() {
      var j, len, ref1, results1;
      if (this.state.internalResults.length === 0 && (this.state.searching || this.state.externalResults.length > 0)) {
        return tr('~IMAGE-BROWSER.NO_INTERNAL_FOUND', {
          query: this.state.query
        });
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
    }, tr('Openclipart.org Images')), div({
      className: 'image-browser-results'
    }, (function() {
      var j, len, ref1, results1;
      if (this.state.searching) {
        return div({}, i({
          className: "fa fa-cog fa-spin"
        }), ' ', tr("~IMAGE-BROWSER.SEARCHING", {
          scope: this.state.searchingAll ? 'all matches for ' : '',
          query: this.state.query
        }));
      } else if (this.state.externalResults.length === 0) {
        return tr('~IMAGE-BROWSER.NO_EXTERNAL_FOUND', {
          query: this.state.query
        });
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
    }).call(this)), this.state.externalResults.length < this.state.numExternalMatches ? div({}, tr('~IMAGE-BROWSER.SHOWING_N_OF_M', {
      numResults: this.state.externalResults.length,
      numTotalResults: this.state.numExternalMatches,
      query: this.state.query
    }), a({
      href: '#',
      onClick: this.showAllMatches
    }, tr('~IMAGE-BROWSER.SHOW_ALL'))) : void 0) : void 0));
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



},{"../utils/open-clipart":14,"../utils/resize-image":15,"../utils/translate":16,"./image-metadata-view":24,"./modal-tabbed-dialog-view":31}],24:[function(require,module,exports){
var a, div, ref, table, td, tr, xlat;

xlat = require('../utils/translate');

ref = React.DOM, div = ref.div, table = ref.table, tr = ref.tr, td = ref.td, a = ref.a;

module.exports = React.createClass({
  displayName: 'ImageMetadata',
  getInitialState: function() {
    return {
      hostname: null
    };
  },
  componentWillMount: function() {
    var link;
    link = document.createElement('a');
    link.setAttribute('href', this.props.metadata.link);
    return this.setState({
      hostname: link.hostname
    });
  },
  render: function() {
    return div({
      className: 'image-metadata'
    }, table({}, tr({}, td({}, xlat('~METADATA.TITLE')), td({}, this.props.metadata.title)), tr({}, td({}, xlat('~METADATA.LINK')), td({}, a({
      href: this.props.metadata.link,
      target: '_blank'
    }, this.state.hostname)))));
  }
});



},{"../utils/translate":16}],25:[function(require,module,exports){
var ImgChoice, div, img, ref, tr;

ref = React.DOM, div = ref.div, img = ref.img;

tr = require('../utils/translate');

ImgChoice = React.createFactory(React.createClass({
  displayName: 'ImgChoice',
  selectNode: function() {
    return this.props.onChange(this.props.node);
  },
  render: function() {
    var className;
    className = "image-choice";
    if (this.props.node.image === this.props.selected.image) {
      className = "image-choice selected";
    }
    return div({
      className: className,
      onClick: this.selectNode
    }, img({
      src: this.props.node.image,
      className: 'image-choice'
    }));
  }
}));

module.exports = React.createClass({
  displayName: 'ImagePickerView',
  getInitialState: function() {
    return {
      opened: false
    };
  },
  toggleOpen: function() {
    return this.setState({
      opened: !this.state.opened
    });
  },
  className: function() {
    if (this.state.opened) {
      return "image-choices opened";
    } else {
      return "image-choices closed";
    }
  },
  render: function() {
    var node;
    return div({
      onClick: this.toggleOpen,
      className: 'image-picker'
    }, div({
      className: 'selected-image'
    }, img({
      src: this.props.selected.image
    })), div({
      className: this.className()
    }, (function() {
      var i, len, ref1, results;
      ref1 = this.props.nodes;
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        node = ref1[i];
        results.push(ImgChoice({
          node: node,
          selected: this.props.selected,
          onChange: this.props.onChange
        }));
      }
      return results;
    }).call(this)));
  }
});



},{"../utils/translate":16}],26:[function(require,module,exports){
var LinkInspectorView, NodeInspectorView, PaletteInspectorView, div, i, ref;

NodeInspectorView = React.createFactory(require('./node-inspector-view'));

LinkInspectorView = React.createFactory(require('./link-inspector-view'));

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
    }, this.props.node ? NodeInspectorView({
      node: this.props.node,
      onNodeChanged: this.props.onNodeChanged,
      onNodeDelete: this.props.onNodeDelete,
      protoNodes: this.props.protoNodes
    }) : this.props.link ? LinkInspectorView({
      link: this.props.link,
      onLinkChanged: this.props.onLinkChanged
    }) : PaletteInspectorView({
      protoNodes: this.props.protoNodes,
      toggleImageBrowser: this.props.toggleImageBrowser,
      linkManager: this.props.linkManager
    })));
  }
});



},{"./link-inspector-view":28,"./node-inspector-view":33,"./palette-inspector-view":36}],27:[function(require,module,exports){
var div;

div = React.DOM.div;

module.exports = React.createClass({
  displayName: 'InspectorTabsView',
  render: function() {
    var tab;
    return div({
      className: 'inspector-tabs'
    }, (function() {
      var i, len, ref, results;
      ref = this.props.tabs;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        tab = ref[i];
        if (tab === this.props.selected) {
          results.push(div({
            className: 'inspector-tab selected'
          }, tab));
        } else {
          results.push(div({
            className: 'inspector-tab'
          }, tab));
        }
      }
      return results;
    }).call(this));
  }
});



},{}],28:[function(require,module,exports){
var InspectorTabs, button, div, h2, input, label, palette, palettes, ref, tr;

ref = React.DOM, div = ref.div, h2 = ref.h2, button = ref.button, label = ref.label, input = ref.input;

tr = require("../utils/translate");

InspectorTabs = React.createFactory(require('./inspector-tabs-view'));

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
    var selected, tabs;
    tabs = [tr('design'), tr('define')];
    selected = tr('design');
    return div({
      className: 'link-inspector-view'
    }, InspectorTabs({
      tabs: tabs,
      selected: selected
    }), div({
      className: 'link-inspector-content'
    }, div({
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
      className: 'link-delete',
      onClick: this.deleteLink
    }, tr("~LINK-EDIT.DELETE")))));
  }
});



},{"../utils/translate":16,"./inspector-tabs-view":27}],29:[function(require,module,exports){
var DiagramToolkit, Importer, Node, NodeList, div, dropImageHandler;

Node = React.createFactory(require('./node-view'));

Importer = require('../utils/importer');

NodeList = require('../models/link-manager');

DiagramToolkit = require('../utils/js-plumb-diagram-toolkit');

dropImageHandler = require('../utils/drop-image-handler');

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
    return $container.droppable({
      accept: '.proto-node',
      hoverClass: "ui-state-highlight",
      drop: (function(_this) {
        return function(e, ui) {
          var $panel, inPanel, panel;
          $panel = $('.inspector-panel-content');
          panel = {
            width: $panel.width(),
            height: $panel.height(),
            offset: $panel.offset()
          };
          inPanel = ui.offset.left >= panel.offset.left && ui.offset.top >= panel.offset.top && ui.offset.left <= panel.offset.left + panel.width && ui.offset.top <= panel.offset.top + panel.height;
          if (!inPanel) {
            return _this.addNode(e, ui);
          }
        };
      })(this)
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
        return _this.props.linkManager.moveNode(node_event.nodeKey, node_event.extra.position, node_event.extra.originalPosition);
      };
    })(this));
  },
  onNodeMoveComplete: function(node_event) {
    return this.handleEvent((function(_this) {
      return function() {
        var left, ref, top;
        ref = node_event.extra.position, left = ref.left, top = ref.top;
        return _this.props.linkManager.moveNodeCompleted(node_event.nodeKey, node_event.extra.position, node_event.extra.originalPosition);
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
    return dropImageHandler(e, (function(_this) {
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
          onMoveComplete: this.onNodeMoveComplete,
          onDelete: this.onNodeDeleted,
          linkManager: this.props.linkManager
        }));
      }
      return results;
    }).call(this)));
  }
});



},{"../models/link-manager":5,"../utils/drop-image-handler":9,"../utils/importer":11,"../utils/js-plumb-diagram-toolkit":12,"./node-view":34}],30:[function(require,module,exports){
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



},{"./modal-view":32}],31:[function(require,module,exports){
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



},{"./modal-dialog-view":30}],32:[function(require,module,exports){
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



},{}],33:[function(require,module,exports){
var ColorPicker, ImagePickerView, InspectorTabs, button, div, h2, input, label, optgroup, option, ref, select, tr;

ref = React.DOM, div = ref.div, h2 = ref.h2, label = ref.label, input = ref.input, select = ref.select, option = ref.option, optgroup = ref.optgroup, button = ref.button;

tr = require("../utils/translate");

InspectorTabs = React.createFactory(require('./inspector-tabs-view'));

ColorPicker = React.createFactory(require('./color-picker-view'));

ImagePickerView = React.createFactory(require('./image-picker-view'));

module.exports = React.createClass({
  displayName: 'NodeInspectorView',
  changeTitle: function(e) {
    var base;
    return typeof (base = this.props).onNodeChanged === "function" ? base.onNodeChanged(this.props.node, {
      title: e.target.value
    }) : void 0;
  },
  changeImage: function(node) {
    var base;
    return typeof (base = this.props).onNodeChanged === "function" ? base.onNodeChanged(this.props.node, {
      image: node.image
    }) : void 0;
  },
  changeColor: function(color) {
    var base;
    return typeof (base = this.props).onNodeChanged === "function" ? base.onNodeChanged(this.props.node, {
      color: color
    }) : void 0;
  },
  "delete": function(e) {
    var base;
    return typeof (base = this.props).onNodeDelete === "function" ? base.onNodeDelete(this.props.node) : void 0;
  },
  render: function() {
    var builtInNodes, droppedNodes, remoteNodes, selected, tabs;
    builtInNodes = [];
    droppedNodes = [];
    remoteNodes = [];
    tabs = [tr('design'), tr('define')];
    selected = tr('design');
    return div({
      className: 'node-inspector-view'
    }, InspectorTabs({
      tabs: tabs,
      selected: selected
    }), div({
      className: 'node-inspector-content'
    }, div({
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
      htmlFor: 'color'
    }, tr("~NODE-EDIT.COLOR")), ColorPicker({
      selected: this.props.node.color,
      onChange: this.changeColor
    })), div({
      className: 'edit-row'
    }, label({
      htmlFor: 'image'
    }, tr("~NODE-EDIT.IMAGE")), ImagePickerView({
      nodes: this.props.protoNodes,
      selected: this.props.node,
      onChange: this.changeImage
    })), div({
      className: 'edit-row'
    }, label({
      className: 'node-delete',
      onClick: this["delete"]
    }, tr("~NODE-EDIT.DELETE")))));
  }
});



},{"../utils/translate":16,"./color-picker-view":19,"./image-picker-view":25,"./inspector-tabs-view":27}],34:[function(require,module,exports){
var div, i, img, ref;

ref = React.DOM, div = ref.div, i = ref.i, img = ref.img;

module.exports = React.createClass({
  displayName: 'NodeView',
  componentDidMount: function() {
    var $elem;
    $elem = $(this.refs.node.getDOMNode());
    $elem.draggable({
      drag: this.doMove,
      stop: this.doStop,
      containment: 'parent'
    });
    return $elem.bind('click touchend', ((function(_this) {
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
  doStop: function(evt, extra) {
    return this.props.onMoveComplete({
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
    var className, ref1, style;
    style = {
      top: this.props.data.y,
      left: this.props.data.x,
      'color': this.props.data.color
    };
    className = "elm";
    if (this.props.selected) {
      className = className + " selected";
    }
    return div({
      className: className,
      ref: 'node',
      style: style,
      'data-node-key': this.props.nodeKey
    }, div({
      className: "img-background"
    }, (((ref1 = this.props.data.image) != null ? ref1.length : void 0) > 0 && this.props.data.image !== '#remote' ? img({
      src: this.props.data.image
    }) : null)), div({
      className: 'node-title'
    }, this.props.data.title));
  }
});



},{}],35:[function(require,module,exports){
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



},{"./proto-node-view":38}],36:[function(require,module,exports){
var ImageMetadata, PaletteImage, ProtoNodeView, div, i, img, ref, span, tr;

ProtoNodeView = React.createFactory(require('./proto-node-view'));

ImageMetadata = React.createFactory(require('./image-metadata-view'));

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
    var index, metadata, node, selectedImage;
    selectedImage = this.props.protoNodes[this.state.selectedIndex].image;
    metadata = this.props.linkManager.getImageMetadata(selectedImage);
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
    }), tr('~PALETTE-INSPECTOR.ADD_IMAGE')))), div({
      className: 'palette-about-image'
    }, div({
      className: 'palette-about-image-title'
    }, i({
      className: "fa fa-info-circle"
    }), span({}, tr('~PALETTE-INSPECTOR.ABOUT_IMAGE')), img({
      src: selectedImage
    })), div({
      className: 'palette-about-image-info'
    }, metadata ? ImageMetadata({
      metadata: metadata
    }) : 'TDB: Add metadata for internal library images')));
  }
});



},{"../utils/translate":16,"./image-metadata-view":24,"./proto-node-view":38}],37:[function(require,module,exports){
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



},{}],38:[function(require,module,exports){
var div, img, ref;

ref = React.DOM, div = ref.div, img = ref.img;

module.exports = React.createClass({
  displayName: 'ProtoNode',
  componentDidMount: function() {
    var reactSafeClone;
    reactSafeClone = function(e) {
      var clone;
      clone = $(this).clone(false);
      clone.attr('data-reactid', null);
      clone.find("*").each(function(i, v) {
        return $(v).attr('data-reactid', null);
      });
      return clone;
    };
    return $(this.refs.node.getDOMNode()).draggable({
      drag: this.doMove,
      revert: true,
      helper: reactSafeClone,
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



},{}],39:[function(require,module,exports){
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
