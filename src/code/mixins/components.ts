import * as React from "react";
import * as _ from "lodash";

interface IMixin<P, S> extends React.ComponentLifecycle<P, S> {
  props: P;
  state: S;
  setState: (newState: S, callback?: () => any) => void;
}

export class Mixin<P, S> implements IMixin<P, S> {
  public static InitialState: () => any;

  protected mixer: Mixer<P, S>;

  constructor(mixer: Mixer<P, S>) {
    this.mixer = mixer;
  }

  public get props() {
    return this.mixer.props;
  }

  public get state() {
    return this.mixer.state;
  }

  public setState(state: S, callback?: () => void) {
    this.mixer.setState(state, callback);
  }
}

export class Mixer<P, S> extends React.Component<P, S> {
  protected mixins: Array<IMixin<any, any>>;

  public setInitialState(s: any, ...rest) {  // checked: any valid
    this.state = _.extend(s, ...rest);
  }

  public componentWillMount() {
    this.mixins.forEach(mixin => mixin.componentWillMount && mixin.componentWillMount());
  }

  public componentDidMount() {
    this.mixins.forEach(mixin => mixin.componentDidMount && mixin.componentDidMount());
  }

  public componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any) { // checked: any valid
    this.mixins.forEach(mixin => mixin.componentWillReceiveProps && mixin.componentWillReceiveProps(nextProps, nextContext));
  }

  /*
  NOT NEEDED
  public shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any) {
    return true;
  }
  */

  public componentWillUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any) {  // checked: any valid
    this.mixins.forEach(mixin => mixin.componentWillUpdate && mixin.componentWillUpdate(nextProps, nextState, nextContext));
  }

  public componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, prevContext: any) {  // checked: any valid
    this.mixins.forEach(mixin => mixin.componentDidUpdate && mixin.componentDidUpdate(prevProps, prevState, prevContext));
  }

  public componentWillUnmount() {
    this.mixins.forEach(mixin => mixin.componentWillUnmount && mixin.componentWillUnmount());
  }
}
