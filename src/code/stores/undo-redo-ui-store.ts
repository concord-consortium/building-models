import { GraphStore } from "./graph-store";
import { Mixin } from "../mixins/components";
import { StoreUnsubscriber } from "./store-class";
const Reflux = require("reflux");

export const UndoRedoUIActions = Reflux.createActions(
  [
    "setCanUndoRedo"
  ]
);

export const UndoRedoUIStore = Reflux.createStore({
  listenables: [UndoRedoUIActions],

  init(context) {
    this.canUndo = false;
    return this.canRedo = false;
  },

  onSetCanUndoRedo(canUndo, canRedo) {
    this.canUndo = canUndo;
    this.canRedo = canRedo;
    return this.notifyChange();
  },

  notifyChange() {
    const data = {
      canUndo: this.canUndo,
      canRedo: this.canRedo
    };
    return this.trigger(data);
  }
});

export interface UndoRedoUIMixinProps {}

export interface UndoRedoUIMixinState {
  canUndo: boolean;
  canRedo: boolean;
}

export class UndoRedoUIMixin extends Mixin<UndoRedoUIMixinProps, UndoRedoUIMixinState> {
  private unsubscribe: StoreUnsubscriber;

  public componentDidMount() {
    this.unsubscribe = UndoRedoUIStore.listen(this.handleUndoRedoUIStateChange);
    // can't add listener in init due to order-of-initialization issues
    GraphStore.addChangeListener(this.handleUndoRedoUIStateChange);
  }

  public componentWillUnmount() {
    return this.unsubscribe();
  }

  private handleUndoRedoUIStateChange = (state) => {
    return this.setState({
      canUndo: state.canUndo,
      canRedo: state.canRedo
    });
  }
}

UndoRedoUIMixin.InitialState = () => {
  return {
    canUndo: UndoRedoUIStore.canUndo,
    canRedo: UndoRedoUIStore.canRedo
  };
};
