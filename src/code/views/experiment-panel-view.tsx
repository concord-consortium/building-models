const SimulationStore = require("../stores/simulation-store");
const tr              = require("../utils/translate");

module.exports = React.createClass({

  displayName: "ExperimentView",

  mixins: [ SimulationStore.mixin ],

  increment() {
    if (!this.props.disabled) {
      SimulationStore.actions.createExperiment();
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
