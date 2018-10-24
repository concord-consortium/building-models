import { SimulationActions, SimulationMixin } from "../stores/simulation-store";
import { tr } from "../utils/translate";

export const ExperimentPanelView = React.createClass({

  displayName: "ExperimentPanelView",

  mixins: [ SimulationMixin ],

  increment() {
    if (!this.props.disabled) {
      SimulationActions.createExperiment();
    }
  },

  renderLabel() {
    const experimentLabel = "Experiment #";
    return <span className="experiment-label">{experimentLabel}</span>;
  },

  renderCounter() {
    const count = this.state.experimentNumber || 211;
    return (
      <div className="experiment-counter" onClick={this.increment}>
        <div className="count">{count}</div>
        <div className="increment">+</div>
      </div>
    );
  },

  render() {
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
});
