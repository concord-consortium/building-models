/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

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

export const LaraMixin = {
  getInitialState() {
    return {laraHasLoaded: LaraStore.laraHasLoaded};
  },

  componentDidMount() {
    return this.unsubscribe = LaraStore.listen(this.onLaraStateChange);
  },

  componentWillUnmount() {
    return this.unsubscribe();
  },

  onLaraStateChange(status) {
    return this.setState({
      laraHasLoaded: status.laraHasLoaded});
  }
};

export interface LaraMixin2Props {}

export interface LaraMixin2State {
  laraHasLoaded: boolean;
}

export class LaraMixin2 extends Mixin<LaraMixin2Props, LaraMixin2State> {
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

LaraMixin2.InitialState = {
  laraHasLoaded: LaraStore.laraHasLoaded
};
