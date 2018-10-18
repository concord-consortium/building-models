/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// based on https://github.com/jzaefferer/undo/blob/master/undo.js
const CodapConnect = require("../models/codap-connect");

const DEFAULT_CONTEXT_NAME = "building-models";

// Note: We use several actions, because they hook into Reflux's dispatching system
// which puts actions in a stack before calling them. We frequently want to ensure
// that all other actions have completed before, e.g., we end a commandBatch.

class Manager {
  static initClass() {
  
    this.prototype.endCommandBatch = Reflux.createAction();
  
    this.prototype.undo = Reflux.createAction();
  
    this.prototype.redo = Reflux.createAction();
  }
  constructor(options) {
    if (options == null) { options = {}; }
    ({debug: this.debug} = options);
    this.commands = [];
    this.stackPosition = -1;
    this.savePosition = -1;
    this.changeListeners = [];
    this.currentBatch = null;

    // listen to all our actions
    this.endCommandBatch.listen(this._endComandBatch, this);
    this.undo.listen(this._undo, this);
    this.redo.listen(this._redo, this);
  }

  // @param optionName: If we provide an optionalName then any command that is sent to
  // the undo manager with a different name will automatically end the current batch.
  // This allows us to group similar commands together and not worry that an unrelated
  // command might be inserted into this same batch before it is closed.
  startCommandBatch(optionalName) {
    if (this.currentBatch && !this.currentBatch.matches(optionalName)) {
      this._endComandBatch();
    }
    if (!this.currentBatch) { return this.currentBatch = new CommandBatch(optionalName); }
  }

  _endComandBatch() {
    if (this.currentBatch) {
      if (this.currentBatch.commands.length > 0) {
        this.commands.push(this.currentBatch);
        this.stackPosition++;
      }
      return this.currentBatch = null;
    }
  }

  createAndExecuteCommand(name, methods) {
    if (this.currentBatch && !this.currentBatch.matches(name)) {
      this._endComandBatch();
    }

    const result = this.execute((new Command(name, methods)));

    // Only notify CODAP of an undoable action on the first command of a batched command
    if ((!this.currentBatch) || (this.currentBatch.commands.length === 1)) {
      const codapConnect = CodapConnect.instance(DEFAULT_CONTEXT_NAME);
      codapConnect.sendUndoableActionPerformed(name);
    }

    return result;
  }

  execute(command) {
    this._clearRedo();
    const result = command.execute(this.debug);
    if (this.currentBatch) {
      this.currentBatch.push(command);
    } else {
      this.commands.push(command);
      this.stackPosition++;
    }
    this._changed();
    if (this.debug) { this.log(); }
    return result;
  }

  // @param drop: calling undo(true) will clear the redo stack. When called on
  // the last item, this is equivalent to throwing away the undone action.
  _undo(drop) {
    if (this.canUndo()) {
      const result = this.commands[this.stackPosition].undo(this.debug);
      this.stackPosition--;
      if (drop) { this._clearRedo(); }
      this._changed();
      if (this.debug) { this.log(); }
      return result;
    } else {
      return false;
    }
  }

  canUndo() {
    return this.stackPosition >= 0;
  }

  _redo() {
    if (this.canRedo()) {
      this.stackPosition++;
      const result = this.commands[this.stackPosition].redo(this.debug);
      this._changed();
      if (this.debug) { this.log(); }
      return result;
    } else {
      return false;
    }
  }

  canRedo() {
    return this.stackPosition < (this.commands.length - 1);
  }

  save() {
    this.savePosition = this.stackPosition;
    return this._changed();
  }

  clearHistory() {
    this.commands = [];
    this.stackPosition = -1;
    this.savePosition = -1;
    this._changed();
    if (this.debug) { return this.log(); }
  }

  dirty() {
    return this.stackPosition !== this.savePosition;
  }

  saved() {
    return this.savePosition !== -1;
  }

  revertToOriginal() {
    return (() => {
      const result = [];
      while (this.canUndo()) {
        result.push(this.undo());
      }
      return result;
    })();
  }

  revertToLastSave() {
    if (this.stackPosition > this.savePosition) {
      return (() => {
        const result = [];
        while (this.dirty()) {
          result.push(this.undo());
        }
        return result;
      })();
    } else if (this.stackPosition < this.savePosition) {
      return (() => {
        const result1 = [];
        while (this.dirty()) {
          result1.push(this.redo());
        }
        return result1;
      })();
    }
  }

  addChangeListener(listener) {
    return this.changeListeners.push(listener);
  }

  log() {
    log.info(`Undo Stack: [${(_.pluck((this.commands.slice(0, this.stackPosition + 1)), "name")).join(", ")}]`);
    return log.info(`Redo Stack: [${(_.pluck((this.commands.slice(this.stackPosition + 1)), "name")).join(", ")}]`);
  }

  clearRedo() {
    this._clearRedo();
    return this._changed();
  }

  _clearRedo() {
    return this.commands = this.commands.slice(0, this.stackPosition + 1);
  }

  _changed() {
    if (this.changeListeners.length > 0) {
      const status = {
        dirty: this.dirty(),
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
        saved: this.saved()
      };
      return Array.from(this.changeListeners).map((listener) =>
        listener(status));
    }
  }
}
Manager.initClass();

class Command {
  constructor(name, methods) { this.name = name; this.methods = methods; undefined; }

  _call(method, debug, via) {
    if (debug) {
      log.info(`Command: ${this.name}.${method}()` + (via ? ` via ${via}` : ""));
    }
    if (this.methods.hasOwnProperty(method)) {
      return this.methods[method]();
    } else {
      throw new Error(`Undefined ${method} method for ${this.name} command`);
    }
  }

  execute(debug) { return this._call("execute", debug); }
  undo(debug) { return this._call("undo", debug); }
  redo(debug) { if (this.methods.hasOwnProperty("redo")) { return this._call("redo", debug); 
  } else { return this._call("execute", debug, "redo"); } }
}

class CommandBatch {
  constructor(name) {
    this.name = name;
    this.commands = [];
  }

  push(command) {
    return this.commands.push(command);
  }

  undo(debug) {
    return (() => {
      const result = [];
      for (let i = this.commands.length - 1; i >= 0; i--) {
        const command = this.commands[i];
        result.push(command.undo(debug));
      }
      return result;
    })();
  }
  redo(debug) {
    return Array.from(this.commands).map((command) => command.redo(debug));
  }

  matches(name) {
    if (this.name && (this.name !== name)) {
      return false;
    }
    return true;
  }
}

const instances = {};
const instance  = function(opts) {
  if (opts == null) { opts = {}; }
  let {contextName, debug} = opts;
  if (!contextName) { contextName = DEFAULT_CONTEXT_NAME; }
  if (!instances[contextName]) { instances[contextName] = new Manager(opts); }
  return instances[contextName];
};

module.exports = {
  instance,
  constructor: Manager,
  command: Command
};
