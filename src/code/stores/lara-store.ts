const Reflux = require("reflux");

import { LaraConnect } from "../models/lara-connect";
import { LaraActions } from "../actions/lara-actions";
import { Mixin } from "../mixins/components";
import { StoreUnsubscriber } from "./store-class";

export const LaraStore = Reflux.createStore({
  listenables: [LaraActions],

  init() {
    const laraConnect = LaraConnect.instance("building-models");
    return this.laraHasLoaded = false;
  },

  onLaraLoaded() {
    this.laraHasLoaded = true;
    return this.notifyChange();
  },

  notifyChange() {
    const data = {laraHasLoaded: this.laraHasLoaded};
    return this.trigger(data);
  }
});

export interface LaraMixinProps {}

export interface LaraMixinState {
  laraHasLoaded: boolean;
}

export class LaraMixin extends Mixin<LaraMixinProps, LaraMixinState> {
  private unsubscribe: StoreUnsubscriber;

  public componentDidMount() {
    return this.unsubscribe = LaraStore.listen(this.handleLaraStateChange);
  }

  public componentWillUnmount() {
    return this.unsubscribe();
  }

  private handleLaraStateChange = (status) => {
    return this.setState({laraHasLoaded: status.laraHasLoaded});
  }
}

LaraMixin.InitialState = () => {
  return {laraHasLoaded: LaraStore.laraHasLoaded};
};

