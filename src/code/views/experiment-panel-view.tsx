import * as React from "react";
import * as _ from "lodash";

import { SimulationActions, SimulationMixin, SimulationMixinState, SimulationMixinProps } from "../stores/simulation-store";
import { tr } from "../utils/translate";
import { Mixer } from "../mixins/components";
import { logEvent } from "../utils/logger";

interface ExperimentPanelViewOuterProps {
  disabled: boolean;
}
type ExperimentPanelViewProps = ExperimentPanelViewOuterProps & SimulationMixinProps;

interface ExperimentPanelViewOuterState {}
type ExperimentPanelViewState = ExperimentPanelViewOuterState & SimulationMixinState;

export class ExperimentPanelView extends Mixer<ExperimentPanelViewProps, ExperimentPanelViewState> {

  public static displayName = "ExperimentPanelView";

  constructor(props: ExperimentPanelViewProps) {
    super(props);
    this.mixins = [new SimulationMixin(this)];
    const outerState: ExperimentPanelViewOuterState = {};
    this.setInitialState(outerState, SimulationMixin.InitialState());
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
    const experimentLabel = tr("~DOCUMENT.ACTIONS.EXPERIMENT_NUM");
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
      const experimentNumber = this.state.experimentNumber + 1;
      SimulationActions.createExperiment();
      logEvent("incremented experiment number", {experimentNumber});
    }
  }
}
