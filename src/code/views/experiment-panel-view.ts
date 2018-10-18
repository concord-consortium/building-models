/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const SimulationStore = require("../stores/simulation-store");
const tr              = require("../utils/translate");

const {div, span, i, input}  = React.DOM;

module.exports = React.createClass({

  displayName: "ExperimentView",

  mixins: [ SimulationStore.mixin ],


  increment() {
    if (!this.props.disabled) {
      return SimulationStore.actions.createExperiment();
    }
  },

  renderLabel() {
    const experimentLabel = "Experiment #";
    return (span({className: "experiment-label"}, experimentLabel));
  },

  renderCounter() {
    const count = this.state.experimentNumber || 211;
    return (div({className: "experiment-counter", onClick: this.increment },
      (div({className: "count"}, count)),
      (div({className: "increment"}, "+"))
    ));
  },

  render() {
    const classes = ["experiment-panel"];
    if (this.props.disabled) {
      classes.push("disabled");
    }
    return (div({className: classes.join(" ") },
      this.renderLabel(),
      this.renderCounter()
    ));
  }
});
