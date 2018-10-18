/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {RadioGroup, Radio}  = require('react-radio-group');
const RadioGroupF     = React.createFactory(RadioGroup);
const RadioF          = React.createFactory(Radio);
const Dropdown        = React.createFactory(require('./dropdown-view'));
const SimulationStore = require('../stores/simulation-store');
const AppSettingsStore = require('../stores/app-settings-store');
const GraphStore      = require('../stores/graph-store').store;
const tr              = require('../utils/translate');
const {div, span, i, input, label}  = React.DOM;

const { SimulationType } = AppSettingsStore.store;
const { Complexity } = AppSettingsStore.store;

module.exports = React.createClass({

  displayName: 'SimulationInspector',

  mixins: [ SimulationStore.mixin, AppSettingsStore.mixin ],

  setDuration(e) {
    return SimulationStore.actions.setDuration(parseInt(e.target.value));
  },

  setCapNodeValues(e) {
    return SimulationStore.actions.capNodeValues(e.target.checked);
  },

  setShowingMinigraphs(e) {
    return AppSettingsStore.actions.showMinigraphs(e.target.checked);
  },

  setRelationshipSymbols(e) {
    return AppSettingsStore.actions.relationshipSymbols(e.target.checked);
  },

  setSimulationType(val) {
    return AppSettingsStore.actions.setSimulationType(val);
  },

  setComplexity(val) {
    return AppSettingsStore.actions.setComplexity(val);
  },

  render() {
    let runPanelClasses = "run-panel";
    const diagramOnly = this.state.simulationType === SimulationType.diagramOnly;
    if (diagramOnly) { runPanelClasses += " collapsed"; }

    const minSimulationType = GraphStore.getMinimumSimulationType();
    const minComplexity = GraphStore.getMinimumComplexity();
    const diagramOnlyDisabled = minSimulationType > SimulationType.diagramOnly;
    const staticDisabled = minSimulationType > SimulationType.static;
    const basicDisabled = minComplexity > Complexity.basic;

    const complexityRadioButtons = (
      (RadioGroupF({
        name: "complexity",
        selectedValue: this.state.complexity,
        onChange: this.setComplexity,
        className: "radio-group"
      }, [
        (label({key: 'complexity-basic'},
          (RadioF({value: Complexity.basic, disabled: basicDisabled})),
          (span({className: basicDisabled ? "disabled" : undefined}, tr('~SIMULATION.COMPLEXITY.BASIC')))
        )),
        (label({key: 'complexity-expanded'},
          (RadioF({value: Complexity.expanded})),
          (span({}, tr('~SIMULATION.COMPLEXITY.EXPANDED')))
        ))
      ]))
    );

    return (div({className: "simulation-panel"},
      (div({className: "title"}, tr("~SIMULATION.SIMULATION_SETTINGS"))),
      (RadioGroupF({
        name: "simulationType",
        selectedValue: this.state.simulationType,
        onChange: this.setSimulationType,
        className: "radio-group simulation-radio-buttons"
      }, [
        (label({key: 'simulation-type-diagram-only'},
          (RadioF({value: SimulationType.diagramOnly, disabled: diagramOnlyDisabled})),
          (span({className: diagramOnlyDisabled ? "disabled" : undefined}, tr('~SIMULATION.COMPLEXITY.DIAGRAM_ONLY')))
        )),
        (div({key: 'simulation-static-options'},
          (label({key: 'simulation-type-static'},
            (RadioF({value: SimulationType.static, disabled: staticDisabled})),
            (span({className: staticDisabled ? "disabled" : undefined}, tr('~SIMULATION.COMPLEXITY.STATIC')))
          )),
          (div({key: 'static-complexity', className: `expanding-submenu${this.state.simulationType === SimulationType.static ? " expanded" : ""}`},
            this.state.simulationType === SimulationType.static ?
              complexityRadioButtons : undefined
          ))
        )),
        (div({key: 'simulation-complexity-options'},
          (label({key: 'simulation-type-time'},
            (RadioF({value: SimulationType.time})),
            (span({}, tr('~SIMULATION.COMPLEXITY.TIME')))
          )),
          (div({key: 'time-complexity',className: `expanding-submenu${this.state.simulationType === SimulationType.time ? " expanded" : ""}`},
            this.state.simulationType === SimulationType.time ?
              complexityRadioButtons : undefined
          ))
        ))
      ])),

      (div({className: `row ${runPanelClasses}`},
          (label({key: 'cap-label'}, [
            input({
              key: 'cap-checkbox',
              type: 'checkbox',
              value: 'cap-values',
              checked: this.state.capNodeValues,
              onChange: this.setCapNodeValues
            }),
            tr('~SIMULATION.CAP_VALUES')
          ]))
        )),

      (div({className: runPanelClasses},
        (div({className: "title"}, tr("~SIMULATION.VIEW_SETTINGS"))),
        (div({className: "row"},
          (label({key: 'minigraphs-label'}, [
            input({
              key: 'minigraphs-checkbox',
              type: 'checkbox',
              value: 'show-mini',
              checked: this.state.showingMinigraphs,
              onChange: this.setShowingMinigraphs
            }),
            tr('~DOCUMENT.ACTIONS.SHOW_MINI_GRAPHS')
          ]))
        )),
        (div({className: "row"},
          (label({key: 'symbols-label'}, [
            input({
              key: 'symbols-checkbox',
              type: 'checkbox',
              value: 'relationship-symbols',
              checked: this.state.relationshipSymbols,
              onChange: this.setRelationshipSymbols
            }),
            tr('~SIMULATION.RELATIONSHIP_SYMBOLS')
          ]))
        ))
      ))

    ));
  }
});
