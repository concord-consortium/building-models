/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");
const log = require("loglevel");
const Reflux = require("reflux");

// based on https://github.com/jzaefferer/undo/blob/master/undo.js
import { CodapConnect } from "../models/codap-connect";

const DEFAULT_CONTEXT_NAME = "building-models";

// Note: We use several actions, because they hook into Reflux's dispatching system
// which puts actions in a stack before calling them. We frequently want to ensure
// that all other actions have completed before, e.g., we end a commandBatch.

export interface UndoRedoListenerOptions {
}

export type UndoRedoListener = (options: UndoRedoListenerOptions) => void;

export class UndoRedoManager {
  public commands: Array<UndoRedoCommand | UndoRedoCommandBatch>;
  public stackPosition: number;

  private endCommandBatch: any; // checked: any ok (reflux action)
  private undo: any; // checked: any ok (reflux action)
  private redo: any; // checked: any ok (reflux action)
  private savePosition: number;
  private changeListeners: UndoRedoListener[];
  private currentBatch: UndoRedoCommandBatch | null;
  private debug: boolean;
  private commandBatchingEnabled: boolean;

  constructor(options) {
    this.endCommandBatch = Reflux.createAction();
    this.undo = Reflux.createAction();
    this.redo = Reflux.createAction();

    if (options == null) { options = {}; }
    ({debug: this.debug} = options);
    this.commands = [];
    this.stackPosition = -1;
    this.savePosition = -1;
    this.changeListeners = [];
    this.currentBatch = null;
    this.commandBatchingEnabled = true;

    // listen to all our actions
    this.endCommandBatch.listen(this._endCommandBatch, this);
    this.undo.listen(this._undo, this);
    this.redo.listen(this._redo, this);
  }

  // @param optionName: If we provide an optionalName then any command that is sent to
  // the undo manager with a different name will automatically end the current batch.
  // This allows us to group similar commands together and not worry that an unrelated
  // command might be inserted into this same batch before it is closed.
  public startCommandBatch(optionalName) {
    if (!this.commandBatchingEnabled) {
      return;
    }
    if (this.currentBatch && !this.currentBatch.matches(optionalName)) {
      this._endCommandBatch();
    }
    if (!this.currentBatch) { return this.currentBatch = new UndoRedoCommandBatch(optionalName); }
  }

  public _endCommandBatch() {
    if (!this.commandBatchingEnabled) {
      return;
    }
    if (this.currentBatch) {
      if (this.currentBatch.commands.length > 0) {
        this.commands.push(this.currentBatch);
        this.stackPosition++;
        this._changed();
      }
      return this.currentBatch = null;
    }
  }

  // allows for disabling of command batching, useful for wrapping command batches in other command batches
  // such as the node slider
  public enableCommandBatching(commandBatchingEnabled: boolean) {
    this.commandBatchingEnabled = commandBatchingEnabled;
  }

  public createAndExecuteCommand(name, methods) {
    if (this.currentBatch && !this.currentBatch.matches(name)) {
      this._endCommandBatch();
    }

    const result = this.execute((new UndoRedoCommand(name, methods)));

    // Only notify CODAP of an undoable action on the first command of a batched command
    if ((!this.currentBatch) || (this.currentBatch.commands.length === 1)) {
      const codapConnect = CodapConnect.instance(DEFAULT_CONTEXT_NAME);
      codapConnect.sendUndoableActionPerformed(name);
    }

    return result;
  }

  public execute(command) {
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
  public _undo(drop) {
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

  public canUndo() {
    return this.stackPosition >= 0;
  }

  public _redo() {
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

  public canRedo() {
    return this.stackPosition < (this.commands.length - 1);
  }

  public save() {
    this.savePosition = this.stackPosition;
    return this._changed();
  }

  public clearHistory() {
    this.commands = [];
    this.stackPosition = -1;
    this.savePosition = -1;
    this._changed();
    if (this.debug) { return this.log(); }
  }

  public dirty() {
    return this.stackPosition !== this.savePosition;
  }

  public saved() {
    return this.savePosition !== -1;
  }

  public revertToOriginal() {
    while (this.canUndo()) {
      this.undo();
    }
  }

  public revertToLastSave() {
    if (this.stackPosition > this.savePosition) {
      while (this.dirty()) {
        this.undo();
      }
    } else if (this.stackPosition < this.savePosition) {
      while (this.dirty()) {
        this.redo();
      }
    }
  }

  public addChangeListener(listener: UndoRedoListener) {
    return this.changeListeners.push(listener);
  }

  public log() {
    log.info(`Undo Stack: [${(_.pluck((this.commands.slice(0, this.stackPosition + 1)), "name")).join(", ")}]`);
    return log.info(`Redo Stack: [${(_.pluck((this.commands.slice(this.stackPosition + 1)), "name")).join(", ")}]`);
  }

  public clearRedo() {
    this._clearRedo();
    return this._changed();
  }

  public _clearRedo() {
    return this.commands = this.commands.slice(0, this.stackPosition + 1);
  }

  public _changed() {
    if (this.changeListeners.length > 0) {
      const status = {
        dirty: this.dirty(),
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
        saved: this.saved()
      };
      return this.changeListeners.map((listener) =>
        listener(status));
    }
  }
}

type UndoRedoMethod = "execute" | "undo" | "redo";
interface UndoRedoMethods {
  execute?: () => void;
  undo?: () => void;
  redo?: () => void;
}

export class UndoRedoCommand {
  public readonly name: string;
  private methods: UndoRedoMethods;

  constructor(name: string, methods: UndoRedoMethods) {
    this.name = name;
    this.methods = methods;
  }

  public _call(method: UndoRedoMethod, debug: boolean, via?: string) {
    if (debug) {
      log.info(`Command: ${this.name}.${method}()` + (via ? ` via ${via}` : ""));
    }
    const methodAction = this.methods[method];
    if (methodAction) {
      return methodAction();
    } else {
      throw new Error(`Undefined ${method} method for ${this.name} command`);
    }
  }

  public execute(debug) { return this._call("execute", debug); }
  public undo(debug) { return this._call("undo", debug); }
  public redo(debug) { if (this.methods.hasOwnProperty("redo")) { return this._call("redo", debug);
  } else { return this._call("execute", debug, "redo"); } }
}

export class UndoRedoCommandBatch {
  public readonly commands: UndoRedoCommand[];
  public readonly name: string;

  constructor(name) {
    this.name = name;
    this.commands = [];
  }

  public push(command) {
    return this.commands.push(command);
  }

  public undo(debug) {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      const command = this.commands[i];
      command.undo(debug);
    }
  }
  public redo(debug) {
    return this.commands.map((command) => command.redo(debug));
  }

  public matches(name) {
    if (this.name && (this.name !== name)) {
      return false;
    }
    return true;
  }
}

const instances = {};

export const undoRedoInstance  = (opts) => {
  if (opts == null) { opts = {}; }
  let {contextName} = opts;
  if (!contextName) { contextName = DEFAULT_CONTEXT_NAME; }
  if (!instances[contextName]) { instances[contextName] = new UndoRedoManager(opts); }
  return instances[contextName];
};
