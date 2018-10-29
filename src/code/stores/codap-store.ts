/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const Reflux = require("reflux");

import { CodapConnect } from "../models/codap-connect";
import { CodapActions } from "../actions/codap-actions";
import { StoreClass, StoreUnsubscriber } from "./store-class";
import { Mixin } from "../mixins/components";

export declare class CodapStoreClass extends StoreClass {
  public codapHasLoaded: boolean;
  public hideUndoRedo: boolean;
}

export const CodapStore: CodapStoreClass = Reflux.createStore({
  listenables: [CodapActions],

  init() {
    const codapConnect = CodapConnect.instance("building-models");
    this.codapHasLoaded = false;
    return this.hideUndoRedo   = false;
  },

  onCodapLoaded() {
    this.codapHasLoaded = true;
    return this.notifyChange();
  },

  onHideUndoRedo() {
    this.hideUndoRedo = true;
    return this.notifyChange();
  },

  notifyChange() {
    const data = {
      codapHasLoaded: this.codapHasLoaded,
      hideUndoRedo:   this.hideUndoRedo
    };
    return this.trigger(data);
  }
});

export interface CodapMixinProps {}

export interface CodapMixinState {
  codapHasLoaded: boolean;
  hideUndoRedo: boolean;
}

export class CodapMixin extends Mixin<CodapMixinProps, CodapMixinState> {
  private unsubscribe: StoreUnsubscriber;

  public componentDidMount() {
    return this.unsubscribe = CodapStore.listen(this.handleCodapStateChange);
  }

  public componentWillUnmount() {
    return this.unsubscribe();
  }

  private handleCodapStateChange = (status) => {
    return this.setState({
      codapHasLoaded: status.codapHasLoaded,
      hideUndoRedo:   status.hideUndoRedo
    });
  }
}

CodapMixin.InitialState = {
  codapHasLoaded: CodapStore.codapHasLoaded,
  hideUndoRedo:   CodapStore.hideUndoRedo
};
