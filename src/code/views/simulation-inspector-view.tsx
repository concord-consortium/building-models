import * as React from "react";
import * as _ from "lodash";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const { RadioGroup, Radio } = require("react-radio-group");
import { SimulationActions, SimulationMixin, SimulationMixinState, SimulationMixinProps } from "../stores/simulation-store";
import { AppSettingsStore, AppSettingsActions, AppSettingsMixin, AppSettingsMixinState, AppSettingsMixinProps } from "../stores/app-settings-store";
import { GraphStore } from "../stores/graph-store";
import { tr } from "../utils/translate";
import { Mixer } from "../mixins/components";

const { SimulationType, Complexity } = AppSettingsStore;

interface SimulationInspectorOuterProps {}
type SimulationInspectorProps = SimulationInspectorOuterProps & SimulationMixinProps & AppSettingsMixinProps;

interface SimulationInspectorViewOuterState {}
type SimulationInspectorViewState = SimulationInspectorViewOuterState & SimulationMixinState & AppSettingsMixinState;

export class SimulationInspectorView extends Mixer<SimulationInspectorProps, SimulationInspectorViewState> {

  public static displayName = "SimulationInspectorView";

  constructor(props: {}) {
    super(props);
    this.mixins = [new SimulationMixin(this, props), new AppSettingsMixin(this, props)];
    const outerProps: SimulationInspectorOuterProps = {};
    this.setInitialState(outerProps, SimulationMixin.InitialState(), AppSettingsMixin.InitialState());
  }

  public render() {
    let runPanelClasses = "run-panel";
    const diagramOnly = this.state.simulationType === SimulationType.diagramOnly;
    if (diagramOnly) { runPanelClasses += " collapsed"; }

    const minSimulationType = GraphStore.getMinimumSimulationType();
    const minComplexity = GraphStore.getMinimumComplexity();
    const diagramOnlyDisabled = minSimulationType > SimulationType.diagramOnly;
    const staticDisabled = minSimulationType > SimulationType.static;
    const basicDisabled = minComplexity > Complexity.basic;

    const complexityRadioButtons = (
      <RadioGroup
        name="complexity"
        selectedValue={this.state.complexity}
        onChange={this.handleComplexity}
        className="radio-group"
      >
        <label key="complexity-basic">
          <Radio value={Complexity.basic} disabled={basicDisabled} />
          <span className={basicDisabled ? "disabled" : undefined}>{tr("~SIMULATION.COMPLEXITY.BASIC")}</span>
        </label>
        <label key="complexity-expanded">
          <Radio value={Complexity.expanded} />
          <span>{tr("~SIMULATION.COMPLEXITY.EXPANDED")}</span>
        </label>
      </RadioGroup>
    );

    return (
      <div className="simulation-panel">
        <div className="title">{tr("~SIMULATION.SIMULATION_SETTINGS")}</div>
        <RadioGroup
          name="simulationType"
          selectedValue={this.state.simulationType}
          onChange={this.handleSimulationType}
          className="radio-group simulation-radio-buttons"
        >
          <label key="simulation-type-diagram-only">
            <Radio value={SimulationType.diagramOnly} disabled={diagramOnlyDisabled} />
            <span className={diagramOnlyDisabled ? "disabled" : undefined}>{tr("~SIMULATION.COMPLEXITY.DIAGRAM_ONLY")}</span>
          </label>
          <div key="simulation-static-options">
            <label key="simulation-type-static">
              <Radio value={SimulationType.static} disabled={staticDisabled} />
              <span className={staticDisabled ? "disabled" : undefined}>{tr("~SIMULATION.COMPLEXITY.STATIC")}</span>
            </label>
            <div key="static-complexity" className={`expanding-submenu${this.state.simulationType === SimulationType.static ? " expanded" : ""}`}>
              {this.state.simulationType === SimulationType.static ? complexityRadioButtons : undefined}
            </div>
          </div>
          <div key="simulation-complexity-options">
            <label key="simulation-type-time">
              <Radio value={SimulationType.time} />
              <span>{tr("~SIMULATION.COMPLEXITY.TIME")}</span>
            </label>
            <div key="time-complexity" className={`expanding-submenu${this.state.simulationType === SimulationType.time ? " expanded" : ""}`}>
              {this.state.simulationType === SimulationType.time ? complexityRadioButtons : undefined}
            </div>
          </div>
        </RadioGroup>

        <div className={`row ${runPanelClasses}`}>
          <label key="cap-label">
            <input
              key="cap-checkbox"
              type="checkbox"
              value="cap-values"
              checked={this.state.capNodeValues}
              onChange={this.handleCapNodeValues}
            />
            {tr("~SIMULATION.CAP_VALUES")}
          </label>
        </div>

        <div className={runPanelClasses}>
          <div className="title">{tr("~SIMULATION.VIEW_SETTINGS")}</div>
          <div className="row">
            <label key="minigraphs-label">
              <input
                key="minigraphs-checkbox"
                type="checkbox"
                value="show-mini"
                checked={this.state.showingMinigraphs}
                onChange={this.handleShowingMinigraphs}
              />
              {tr("~DOCUMENT.ACTIONS.SHOW_MINI_GRAPHS")}
            </label>
          </div>
          <div className="row">
            <label key="symbols-label">
              <input
                key="symbols-checkbox"
                type="checkbox"
                value="relationship-symbols"
                checked={this.state.relationshipSymbols}
                onChange={this.handleRelationshipSymbols}
              />
              {tr("~SIMULATION.RELATIONSHIP_SYMBOLS")}
            </label>
          </div>
        </div>
      </div>
    );
  }

  private handleCapNodeValues = (e) => {
    SimulationActions.capNodeValues(e.target.checked);
  }

  private handleShowingMinigraphs = (e) => {
    AppSettingsActions.showMinigraphs(e.target.checked);
  }

  private handleRelationshipSymbols = (e) => {
    AppSettingsActions.relationshipSymbols(e.target.checked);
  }

  private handleSimulationType = (val) => {
    AppSettingsActions.setSimulationType(val);
  }

  private handleComplexity = (val) => {
    AppSettingsActions.setComplexity(val);
  }
}
