/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let CodapConnect;
const { IframePhoneRpcEndpoint } = (require("iframe-phone"));
const tr = require("../utils/translate");
const CodapActions    = require("../actions/codap-actions");
const undoRedoUIActions = (require("../stores/undo-redo-ui-store")).actions;
const SimulationStore = require("../stores/simulation-store");
const TimeUnits       = require("../utils/time-units");
const { escapeRegExp } = (require("../utils/escape-reg-ex"));
// log -- see loglevel in package.json

module.exports = (CodapConnect = (function() {
  CodapConnect = class CodapConnect {
    static initClass() {
  
      this.instances = {};
      // map of context -> instance
    }

    static instance(context) {
      if (CodapConnect.instances[context] == null) { CodapConnect.instances[context] = new CodapConnect(context); }
      return CodapConnect.instances[context];
    }

    constructor(context) {
      this.codapRequestHandler = this.codapRequestHandler.bind(this);
      log.info("CodapConnect: initializing");
      const GraphStore = require("../stores/graph-store");
      this.standaloneMode = false;
      this.queue = [];
      this.graphStore = GraphStore.store;
      this.lastTimeSent = this._timeStamp();
      this.sendThrottleMs = 300;

      this.dataContextName = "Sage Simulation";
      this.simulationCollectionName = "Simulation";
      this.samplesCollectionName = "Samples";

      this.defaultExperimentName = "ExpNo";
      SimulationStore.actions.recordingFramesCreated.listen(this.addData.bind(this));

      CodapActions.sendUndoToCODAP.listen(this._sendUndoToCODAP.bind(this));
      CodapActions.sendRedoToCODAP.listen(this._sendRedoToCODAP.bind(this));


      this.codapPhone = new IframePhoneRpcEndpoint( this.codapRequestHandler,
        "data-interactive", window.parent );

      // load any previous data; also check if CODAP's undo is available,
      // or if we are in standalone mode.
      this.codapPhone.call([
        {
          action: "update",
          resource: "interactiveFrame",
          values: {
            title: tr("~CODAP.INTERACTIVE_FRAME.TITLE"),
            preventBringToFront: true
          }
        },
        {
          action: "get",
          resource: "interactiveFrame"
        },
        {
          action: "get",
          resource: "dataContext"
        }
      ], ret => {
        if (ret) {
          const frame   = ret[1];
          context = ret[2];

          this.graphStore.setUsingCODAP(true);

          if (frame != null ? frame.values.externalUndoAvailable : undefined) {
            CodapActions.hideUndoRedo();
          } else if (frame != null ? frame.values.standaloneUndoModeAvailable : undefined) {
            this.standaloneMode = true;
            this.graphStore.setCodapStandaloneMode(true);
          }

          // We check for game state in either the frame (CODAP API 2.0) or the dataContext
          // (API 1.0). We ignore the dataContext if we find game state in the interactiveFrame
          const state = (frame != null ? frame.values.savedState : undefined) ||
                  __guard__(__guard__(context != null ? context.values : undefined, x1 => x1.contextStorage), x => x.gameState);

          if (state != null) {
            this.graphStore.deleteAll();
            this.graphStore.loadData(state);
            return this._initialSyncAttributeProperties(null, true);
          }
        } else {
          return log.info("null response in codap-connect codapPhone.call");
        }
      });


      // check if we already have a datacontext (if we're opening a saved model).
      // if we don't create one with our collections. Then kick off init
      this.codapPhone.call({
        action: "get",
        resource: `dataContext[${this.dataContextName}]`
      }
      , ret => {
        // ret==null is indication of timeout, not an indication that the data set
        // doesn't exist.
        if (!ret || ret.success) {
          let attrs;
          if (attrs = (__guard__(__guard__(__guard__(ret != null ? ret.values : undefined, x2 => x2.collections), x1 => x1[1]), x => x.attrs) != null)) {
            this._initialSyncAttributeProperties(attrs);
          }
        } else {
          this._createDataContext();
        }
        this.updateExperimentColumn();
        return this._getExperimentNumber();
      });
    }

    // initial synchronization; primarily used for synchronizing legacy documents
    _initialSyncAttributeProperties(attrs, isLoaded) {
      if (attrs) { this._attrsToSync = attrs; }
      if (isLoaded) { this._attrsAreLoaded = isLoaded; }
      if (this._attrsToSync && this._attrsAreLoaded) {
        this._syncAttributeProperties(this._attrsToSync, true);
        return this._attrsToSync = null;
      }
    }


    _createDataContext() {
      const sampleDataAttrs = this._getSampleAttributes();
      const message = {
        action: "create",
        resource: "dataContext",
        values: {
          name: this.dataContextName,
          title: this.dataContextName,
          collections:[
            {
              name: this.simulationCollectionName,
              title: "Sage Simulation",
              labels: {
                singleCase: "run",
                pluralCase: "runs"
              },
              attrs: [{
                name: this.defaultExperimentName,
                type: "categorical"
              }
              ]
            },
            {
              parent: this.simulationCollectionName,
              name: this.samplesCollectionName,
              title: this.samplesCollectionName,
              labels: {
                singleCase: "sample",
                pluralCase: "samples"
              },
              attrs:  sampleDataAttrs
            }
          ]
        }
      };

      return this.codapPhone.call(message, this.initGameHandler);
    }


    // Return the column headings and types for our samples. (steps, NodeA, nodeB, nodeC)
    _getSampleAttributes() {
      const nodes = this.graphStore.getNodes();

      // First column definition is the time index
      const timeUnit = TimeUnits.toString(SimulationStore.store.stepUnits(), true);
      const sampleDataAttrs = [
        {
          name: timeUnit,
          type: "numeric"
        }
      ];

      const addNodeAttr = function(node) {
        const type = node.valueDefinedSemiQuantitatively ? "qualitative" : "numeric";
        return sampleDataAttrs.push({
          name: node.codapName || node.title,
          type
        });
      };

      _.each(nodes, node => addNodeAttr(node));

      return sampleDataAttrs;
    }


    // If CODAPs Samples collection doesn't have all our data attributes add the new ones.
    _createMissingDataAttributes(callback) {
      // TODO: Computing this every time is expensive. Use a flag set from GraphChange event?
      const currentAttributes = _.sortBy(this._getSampleAttributes(), "name");
      const attributesKey = _.pluck(currentAttributes,"name").join("|");
      if (this.attributesKey === attributesKey) {
        if (callback) { return callback(); }
      } else {
        const doResolve = listAttributeResponse => {
          if (listAttributeResponse != null ? listAttributeResponse.success : undefined) {
            const { values } = listAttributeResponse;
            const newAttributes = _.select(currentAttributes, a => !_.includes(values,a.name));
            const message = {
              action: "create",
              resource: `dataContext[${this.dataContextName}].collection[${this.samplesCollectionName}].attribute`,
              values: newAttributes
            };
            return this.codapPhone.call(message, response => {
              if (response.success) {
                if ((response.values != null ? response.values.attrs : undefined) != null) {
                  this._syncAttributeProperties(response.values.attrs, true);
                }
                this.attributesKey = attributesKey;
                if (callback) { return callback(); }
              } else {
                return log.info("Unable to update Attributes");
              }
            });
          } else {
            return log.info("unable to list attributes");
          }
        };

        const getListing = {
          action: "get",
          resource: `dataContext[${this.dataContextName}].collection[${this.samplesCollectionName}].attributeList`
        };
        this.codapPhone.call(getListing, doResolve);
        return log.info("requested list of attributes");
      }
    }

    _syncAttributeProperties(attrProps, initialSync) {
      const nodesToSync = initialSync 
        ? _.filter(this.graphStore.nodeKeys, node => !node.codapID || !node.codapName) 
        : _.map(this.graphStore.nodeKeys, node => node); // map nodeKeys to array of nodes
      if (nodesToSync != null ? nodesToSync.length : undefined) {
        return _.each(attrProps, attr => {
          // check for id match
          let node = _.find(nodesToSync, node => node.codapID === attr.id);
          // check for clientName match
          if (!node && attr.clientName) {
            node = _.find(nodesToSync, node => node.title === attr.clientName);
          }
          // check for codapName match
          if (!node && attr.name) {
            node = _.find(nodesToSync, node => node.codapName === attr.name);
          }
          // check for title match; use RegEx to match '_' as wildcard character
          if (!node && attr.name) {
            const nameRegEx = new RegExp(`^${escapeRegExp((attr.name.replace(/_/g, "?")))}$`);
            node = _.find(nodesToSync, node => nameRegEx.test(node.title));
          }
          if (node) {
            // sync id and name
            if (!node.codapID || !node.codapName) {
              if (!node.codapID) { node.codapID = attr.id; }
              node.codapName = attr.name;
            // sync name/title, but only if it's changed on the CODAP side
            } else if (node.codapName !== attr.name) {
              node.codapName = attr.name;
              if (!initialSync && (node.title !== attr.name)) {
                this.graphStore._changeNode(node, { title: attr.name }, false);
              }
            }
            if (initialSync) {
              _.remove(nodesToSync, node => node.codapID && node.codapName);
            } else {
              _.remove(nodesToSync, node => node.codapID === attr.id);
            }
          }
          if (!(nodesToSync != null ? nodesToSync.length : undefined)) {
            return false;
          }
        }); // terminate iteration if all nodes are synced
      }
    }

    sendRenameAttribute(nodeKey, prevTitle) {
      const node = this.graphStore.nodeKeys[nodeKey];
      const codapKey = node.codapID || node.codapName || prevTitle;
      if (codapKey) {
        const message = {
          action: "update",
          resource: `dataContext[${this.dataContextName}].collection[${this.samplesCollectionName}].attribute[${codapKey}]`,
          values: { name: node.title },
          meta: {
            dirtyDocument: false
          }
        };
        return this.codapPhone.call(message, response => {
          if (response.success) {
            if (__guard__(response != null ? response.values : undefined, x => x.attrs)) {
              return this._syncAttributeProperties(response.values.attrs);
            }
          } else if (node.codapID && node.codapName) {
            return log.warn("Error: CODAP attribute rename failed!");
          }
        });
      }
    }



    // updateExperimentColumn
    //
    // At the time of document creation in CODAP we don't always know
    // the final language the document is going to be rendered in. For
    // example, An author sets up a CODAP document with Sage, and some
    // other CODAP plugins. Next, they make copies of this document for
    // several languages. Regardless of the author's language setting,
    // the experiment number column has the un-localized label. Later
    // when an i18 user collects experiment data for the first time, we
    // then rename the column from the default to that user's language.
    // We could partially avoid this if data CODAP table attributes
    // supported `titles` for localized names.
    updateExperimentColumn() {
      const experimentNumberLabel = tr("~CODAP.SIMULATION.EXPERIMENT");
      const handleSimulationAttributes = listAttributeResponse => {
        if (listAttributeResponse != null ? listAttributeResponse.success : undefined) {
          const values = _.pluck(listAttributeResponse.values, "name");
          if (!_.includes(values, experimentNumberLabel)) {
            if (_.includes(values, this.defaultExperimentName)) {
              return this.renameExperimentNumberColumn(experimentNumberLabel);
            } else {
              return this.createExperimentNumberColumn(experimentNumberLabel);
            }
          }
        } else {
          return log.warn("CODAP: unable to list Simulation attributes");
        }
      };

      const getListing = {
        action: "get",
        resource: `dataContext[${this.dataContextName}].collection[${this.simulationCollectionName}].attributeList`
      };
      return this.codapPhone.call(getListing, handleSimulationAttributes);
    }

    createExperimentNumberColumn(label) {
      const experimentAttributes = {
        name: label,
        type: "categorical"
      };
      const message = {
        action: "create",
        resource: `dataContext[${this.dataContextName}].collection[${this.simulationCollectionName}].attribute`,
        values: [ experimentAttributes ]
      };
      return this.codapPhone.call(message, function(response) {
        if (response.success) {
          return log.info(`created attribute ${label}`);
        } else {
          return log.warn(`Unable to create attribute ${label}`);
        }
      });
    }

    renameExperimentNumberColumn(label) {
      return this.renameSimulationProperty(this.defaultExperimentName, label);
    }

    renameSimulationProperty(oldValue, newValue) {
      const message = {
        action: "update",
        resource: `dataContext[${this.dataContextName}].collection[${this.simulationCollectionName}].attribute[${oldValue}]`,
        values: { name: newValue },
        meta: {
          dirtyDocument: false
        }
      };
      return this.codapPhone.call(message, function(response) {
        if (response.success) {
          return log.info(`Renamed Simulation attribute: ${oldValue} → ${newValue}`);
        } else {
          return log.info("CODAP rename Simulation attribute failed!");
        }
      });
    }

    _timeStamp() {
      return new Date().getTime();
    }


    _shouldSend() {
      const currentTime = this._timeStamp();
      const elapsedTime = currentTime - this.lastTimeSent;
      return elapsedTime > this.sendThrottleMs;
    }


    _sendSimulationData() {
      // drain the queue synchronously. Re-add pending data in case of error.
      const sampleData = this.queue;
      this.queue = [];

      const createItemsMessage = {
        action: "create",
        resource: `dataContext[${this.dataContextName}].item`,
        values: sampleData
      };

      if (sampleData.length > 0) {
        this.createTable();
        return this._createMissingDataAttributes(() => {
          // Send the data, if any
          const createItemsCallback = newSampleResult => {
            if (newSampleResult.success) {
              return this.lastTimeSent = this._timeStamp();
            } else {
              log.info("CODAP returned an error on 'create item''");
              // Re-add pending data in case of error.
              return this.queue = sampleData.concat(this.queue);
            }
          };
          return this.codapPhone.call(createItemsMessage, createItemsCallback);
        });
      }
    }


    _sendUndoToCODAP() {
      return this.codapPhone.call({
        action: "notify",
        resource: "undoChangeNotice",
        values: {
          operation: this.standaloneMode ? "undoButtonPress" : "undoAction"
        }
      }, function(response) {
        if ((__guard__(response != null ? response.values : undefined, x => x.canUndo) != null) && (__guard__(response != null ? response.values : undefined, x1 => x1.canRedo) != null)) {
          return undoRedoUIActions.setCanUndoRedo(response.values.canUndo, response.values.canRedo);
        }
      });
    }

    _sendRedoToCODAP() {
      return this.codapPhone.call({
        action: "notify",
        resource: "undoChangeNotice",
        values: {
          operation: this.standaloneMode ? "redoButtonPress" : "redoAction"
        }
      }, function(response) {
        if ((__guard__(response != null ? response.values : undefined, x => x.canUndo) != null) && (__guard__(response != null ? response.values : undefined, x1 => x1.canRedo) != null)) {
          return undoRedoUIActions.setCanUndoRedo(response.values.canUndo, response.values.canRedo);
        }
      });
    }

    sendUndoableActionPerformed(logMessage) {
      return this.codapPhone.call({
        action: "notify",
        resource: "undoChangeNotice",
        values: {
          operation: "undoableActionPerformed",
          logMessage
        }
      }, function(response) {
        if ((__guard__(response != null ? response.values : undefined, x => x.canUndo) != null) && (__guard__(response != null ? response.values : undefined, x1 => x1.canRedo) != null)) {
          return undoRedoUIActions.setCanUndoRedo(response.values.canUndo, response.values.canRedo);
        }
      });
    }

    addData(data) {
      const timeUnit = TimeUnits.toString(SimulationStore.store.stepUnits(), true);
      // Create the sample data values (node values array)
      const sampleData = _.map(data, function(frame) {
        const sample = {};
        sample[tr("~CODAP.SIMULATION.EXPERIMENT")] = SimulationStore.store.settings.experimentNumber;
        sample[timeUnit] = frame.time;
        _.each(frame.nodes, n => sample[n.title] = n.value);
        return sample;
      });
      this.queue = this.queue.concat(sampleData);

      if (this._shouldSend()) {
        return this._sendSimulationData();
      } else {
        return setTimeout(this._sendSimulationData.bind(this), this.sendThrottleMs);
      }
    }

    createGraph(yAttributeName) {
      this._createMissingDataAttributes();
      const timeUnit = TimeUnits.toString(SimulationStore.store.stepUnits(), true);

      return this.codapPhone.call({
        action: "create",
        resource: "component",
        values: {
          type: "graph",
          dataContext: this.dataContextName,
          xAttributeName: timeUnit,
          yAttributeName,
          size: { width: 242, height: 221 },
          position: "bottom",
          enableNumberToggle: true
        }
      });
    }

    createTable() {
      if (!this.tableCreated) {
        this.codapPhone.call({
          action: "create",
          resource: "component",
          values: {
            type: "caseTable",
            dataContext: this.dataContextName
          }
        });
        return this.tableCreated = true;
      }
    }

    codapRequestHandler(cmd, callback) {
      let successes;
      const { resource } = cmd;
      const { action } = cmd;
      // if we have an array of changes, for now just extract the first one
      const change = Array.isArray(cmd.values) ? cmd.values[0] : cmd.values;
      const operation = change != null ? change.operation : undefined;
      const paletteManager = require("../stores/palette-store");

      switch (resource) {
      case "interactiveState":
        if (action === "get") {
          log.info("Received saveState request from CODAP.");
          return callback({
            success: true,
            state: this.graphStore.serialize(paletteManager.store.palette)
          });
        }
        break;
      case "undoChangeNotice":
        if (operation === "undoAction") {
          log.info("Received undoAction request from CODAP.");
          successes = this.graphStore.undo(true);
          callback({
            success: this.reduceSuccesses(successes) !== false});
        }
        if (operation === "redoAction") {
          log.info("Received redoAction request from CODAP.");
          successes = this.graphStore.redo(true);
          callback({
            success: this.reduceSuccesses(successes) !== false});
        }
        if (operation === "clearUndo") {
          log.info("Received clearUndo request from CODAP.");
          this.graphStore.undoRedoManager.clearHistory();
        }
        if (operation === "clearRedo") {
          log.info("Received clearRedo request from CODAP.");
          this.graphStore.undoRedoManager.clearRedo();
        }
        // update undo/redo UI state based on CODAP undo/redo UI state
        if (((cmd.values != null ? cmd.values.canUndo : undefined) != null) && ((cmd.values != null ? cmd.values.canRedo : undefined) != null)) {
          return undoRedoUIActions.setCanUndoRedo(cmd.values != null ? cmd.values.canUndo : undefined, cmd.values != null ? cmd.values.canRedo : undefined);
        }
        break;
      case "dataContextChangeNotice[Sage Simulation]":
        if (operation === "updateAttributes") {
          if (__guard__(change != null ? change.result : undefined, x => x.attrs)) {
            return this._syncAttributeProperties(change.result.attrs);
          }
        }
        break;
      default:
        return log.info(`Unhandled request received from CODAP: ${JSON.stringify(cmd)}`);
      }
    }

    // undo/redo events can return an array of successes
    // this reduces that array to true iff every element is not explicitly false
    reduceSuccesses(successes) {
      if (!(successes != null ? successes.length : undefined)) { return successes; }        // return successes unless it's a non-zero length array
      for (let s of Array.from(successes)) { if (s === false) { return false; } }  // return false if we encounter *any* explicit false values in the array
      return true;
    }

    // Get the experiment-number of the last case in CODAP, and set the simulation store
    // to the next experiment number. This is only called in the case where we found an
    // existing data context in CODAP.
    _getExperimentNumber(result) {
      const runsCollection = `dataContext[${this.dataContextName}].collection[${this.simulationCollectionName}]`;
      // find out how many cases there are
      return this.codapPhone.call({
        action: "get",
        resource: `${runsCollection}.caseCount`
      }
      , ret => {
        if (ret != null ? ret.success : undefined) {
          const caseCount = ret.values;
          if (caseCount > 0) {
            // get last case, and find its number
            this.codapPhone.call({
              action: "get",
              resource: `${runsCollection}.caseByIndex[${caseCount-1}]`
            }
            , function(ret2) {
              if (ret2 != null ? ret2.success : undefined) {
                const lastCase = ret2.values["case"];
                const lastExperimentNumber = parseInt(lastCase.values[tr("~CODAP.SIMULATION.EXPERIMENT")], 10) || 0;
                return SimulationStore.actions.setExperimentNumber(lastExperimentNumber + 1);
              }
            });
          }
        }

        return this.initGameHandler(ret);
      });
    }

    initGameHandler(result) {
      if (result && result.success) {
        return CodapActions.codapLoaded();
      }
    }

    //
    // Requests a CODAP action, if the Building Models tool is configured to reside
    // in CODAP. For actions that may be requested, see
    // https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API .
    //
    // Similarly to the Google Drive API, this method will report results of its
    // asynchronous request either by invoking the provided callback, or, if no
    // callback is provided, will return a Promise.
    //
    // Example:
    //   codapConnect.request('logAction', {formatStr: 'test message'}).then ->
    //     log.info 'received log reply!'
    //

    request(action, args, callback) {
      const promise = new Promise((resolve, reject) => {
        return this.codapPhone.call({ action, args }, function(reply) {
          if (callback) {
            callback(reply);
          }
          if (reply && reply.success) {
            return resolve(reply);
          } else {
            return reject("CODAP request error");
          }
        });
      });
      return promise;
    }
  };
  CodapConnect.initClass();
  return CodapConnect;
})());

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}