import * as React from "react";
import * as _ from "lodash";

export class Mixin<P, S> extends React.Component<P, S> {
  public static InitialState: () => any;

  protected mixer: any;

  constructor(mixer: any, props: P) {
    super(props);
    this.mixer = mixer;
  }

  public setState(state: S) {
    this.mixer.setState(state);
  }
}

export class Mixer<P, S> extends React.Component<P, S> {
  protected mixins: Array<React.Component<any, any>>;

  public setInitialState(s: any, ...rest) {
    this.state = _.extend(s, ...rest);
  }

  public componentWillMount() {
    this.mixins.forEach(mixin => mixin.componentWillMount && mixin.componentWillMount());
  }

  public componentDidMount() {
    this.mixins.forEach(mixin => mixin.componentDidMount && mixin.componentDidMount());
  }

  public componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any) {
    this.mixins.forEach(mixin => mixin.componentWillReceiveProps && mixin.componentWillReceiveProps(nextProps, nextContext));
  }

  /*
  NOT NEEDED
  public shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any) {
    return true;
  }
  */

  public componentWillUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any) {
    this.mixins.forEach(mixin => mixin.componentWillUpdate && mixin.componentWillUpdate(nextProps, nextState, nextContext));
  }

  public componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, prevContext: any) {
    this.mixins.forEach(mixin => mixin.componentDidUpdate && mixin.componentDidUpdate(prevProps, prevState, prevContext));
  }

  public componentWillUnmount() {
    this.mixins.forEach(mixin => mixin.componentWillUnmount && mixin.componentWillUnmount());
  }
}
