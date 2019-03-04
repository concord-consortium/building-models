/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const log = require("loglevel");

const IframePhone = require("iframe-phone");
import { undoRedoInstance, UndoRedoManager } from "../utils/undo-redo";
import { PaletteStore, PaletteStoreClass } from "../stores/palette-store";
import { GraphStore, GraphStoreClass } from "../stores/graph-store";

interface LaraConnectMap {
  [key: string]: LaraConnect;
}

interface LaraPhone {
  addListener(message: string, callback: (data?: any) => void); // checked: any ok
  post(message: string, data: any); // checked: any ok
}

export class LaraConnect {
  public static instances: LaraConnectMap;

  public static initialize() {
    LaraConnect.instances = {};
  }

  public static instance(context) {
    if (LaraConnect.instances[context] == null) { LaraConnect.instances[context] = new LaraConnect(context); }
    return LaraConnect.instances[context];
  }
  private undoRedoManager: UndoRedoManager;
  private loaded: boolean;
  private graphStore: GraphStoreClass;
  private paletteStore: PaletteStoreClass;
  private laraPhone: LaraPhone;
  private lastCommandStackPosition: number;

  constructor(context) {
    log.info("LaraConnect: initializing");
    this.undoRedoManager = undoRedoInstance({debug: false, context});
    this.loaded = false;
    this.graphStore = GraphStore;
    this.paletteStore = PaletteStore;
    this.laraPhone = IframePhone.getIFrameEndpoint();
    this.lastCommandStackPosition = -1;

    // Setup listeners
    this.laraPhone.addListener("initInteractive", data => {
      if (!data) {
        return this.laraPhone.post("response", "init failed!");
      } else {
        log.info("Init received from parent", data);
        this.graphStore.setUsingLara(true);
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
        if (data.content) {
          this.graphStore.loadData(data.content);
        } else {
          this.graphStore.loadData(data);
        }
        const nodeCount = this.graphStore.getNodes().length;
        const loadResult = `Initialization success! Loaded ${nodeCount} node(s)`;
        log.info(loadResult);
        this.laraPhone.post("response", loadResult);
        return this.loaded = true;
      }
    });

    this.laraPhone.addListener("getInteractiveState", data => {
      log.info("Request for interactiveState received from parent Iframe", data);
      const saveData = this.graphStore.toJsonString(this.paletteStore.palette);
      return this.laraPhone.post("interactiveState", saveData);
    });

    this.graphStore.addChangeListener(this.handleUndoRedoStateChange.bind(this));

    // load any previous data by initializing handshake
    this.laraPhone.post("initInteractive", "Sage is ready");
  }

  private handleUndoRedoStateChange = (state) => {
    const lastAction = this.undoRedoManager.commands[this.undoRedoManager.stackPosition];
    if (lastAction && this.loaded) {
      if ((this.undoRedoManager.stackPosition < (this.undoRedoManager.commands.length - 1)) && (this.lastCommandStackPosition > this.undoRedoManager.stackPosition)) {
        // User clicked Undo
        this.laraPhone.post("log", {action: "undo"});
      } else {
        this.laraPhone.post("log", {action: lastAction.name});
      }
    }
    return this.lastCommandStackPosition = this.undoRedoManager.stackPosition;
  }
}

LaraConnect.initialize();
