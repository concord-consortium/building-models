import * as React from "react";
import * as _ from "lodash";

import { SimulationActions, SimulationMixin2, SimulationMixin2State } from "../stores/simulation-store";
import { tr } from "../utils/translate";
import { Mixer } from "../mixins/components";

interface ExperimentPanelViewProps {
  disabled: boolean;
}

type ExperimentPanelViewState = SimulationMixin2State;

export class ExperimentPanelView extends Mixer<ExperimentPanelViewProps, ExperimentPanelViewState> {

  public static displayName = "ExperimentPanelView";

  constructor(props: ExperimentPanelViewProps) {
    super(props);
    this.mixins = [new SimulationMixin2(this, props)];
    this.setInitialState({}, SimulationMixin2.InitialState);
  }

  public render() {
    const classes = ["experiment-panel"];
    if (this.props.disabled) {
      classes.push("disabled");
    }
    return (
      <div className={classes.join(" ")}>
        {this.renderLabel()}
        {this.renderCounter()}
      </div>
    );
  }

  private renderLabel() {
    const experimentLabel = "Experiment #";
    return <span className="experiment-label">{experimentLabel}</span>;
  }

  private renderCounter() {
    const count = this.state.experimentNumber || 211;
    return (
      <div className="experiment-counter" onClick={this.handleIncrement}>
        <div className="count">{count}</div>
        <div className="increment">+</div>
      </div>
    );
  }

  private handleIncrement = () => {
    if (!this.props.disabled) {
      SimulationActions.createExperiment();
    }
  }
}
