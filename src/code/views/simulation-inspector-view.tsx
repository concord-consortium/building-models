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
import { urlParams } from "../utils/url-params";
import { CodapConnect } from "../models/codap-connect";
import { ModalModelTypeHelpView } from "./modal-model-type-help";

const { SimulationType, Complexity } = AppSettingsStore;

const helpIcon = <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>;

interface SimulationInspectorOuterProps {
  onShowModelTypeHelp: () => void;
}
type SimulationInspectorProps = SimulationInspectorOuterProps & SimulationMixinProps & AppSettingsMixinProps;

interface SimulationInspectorViewOuterState {}
type SimulationInspectorViewState = SimulationInspectorViewOuterState & SimulationMixinState & AppSettingsMixinState;

export class SimulationInspectorView extends Mixer<SimulationInspectorProps, SimulationInspectorViewState> {

  public static displayName = "SimulationInspectorView";
  private codapConnect: CodapConnect;

  constructor(props: SimulationInspectorProps) {
    super(props);
    this.mixins = [new SimulationMixin(this), new AppSettingsMixin(this)];
    this.setInitialState(props, SimulationMixin.InitialState(), AppSettingsMixin.InitialState());
  }

  public componentWillMount() {
    this.codapConnect = CodapConnect.instance("building-models");
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

    return (
      <div className="simulation-panel">
        <div className="title">{tr("~SIMULATION.SIMULATION_SETTINGS")}</div>
        <RadioGroup
          name="simulationType"
          selectedValue={this.state.simulationType}
          onChange={this.handleSimulationType}
          className="radio-group simulation-radio-buttons"
        >
          <div className="radio-group-title">{tr("~SIMULATION.MODEL_TYPE")} <span className="model-type-help-icon" onClick={this.props.onShowModelTypeHelp} title={tr("~MENU.ABOUT")} >{helpIcon}</span></div>
          <label key="simulation-type-diagram-only">
            <Radio value={SimulationType.diagramOnly} disabled={diagramOnlyDisabled} />
            <span className={diagramOnlyDisabled ? "disabled" : undefined}>{tr("~SIMULATION.COMPLEXITY.DIAGRAM_ONLY")}</span>
          </label>
          <div key="simulation-static-options">
            <label key="simulation-type-static">
              <Radio value={SimulationType.static} disabled={staticDisabled} />
              <span className={staticDisabled ? "disabled" : undefined}>{tr("~SIMULATION.COMPLEXITY.STATIC")}</span>
            </label>
          </div>
          <div key="simulation-complexity-options">
            <label key="simulation-type-time">
              <Radio value={SimulationType.time} />
              <span>{tr("~SIMULATION.COMPLEXITY.TIME")}</span>
            </label>
          </div>
        </RadioGroup>

        <RadioGroup
          name="complexity"
          selectedValue={this.state.complexity}
          onChange={this.handleComplexity}
          className="radio-group complexity-radio-buttons"
        >
          <div className="radio-group-title">{tr("~SIMULATION.RELATIONSHIPS")}</div>
          <label key="complexity-basic">
            <Radio value={Complexity.basic} disabled={basicDisabled} />
            <span className={basicDisabled ? "disabled" : undefined}>{tr("~SIMULATION.COMPLEXITY.BASIC")}</span>
          </label>
          <label key="complexity-expanded">
            <Radio value={Complexity.expanded} />
            <span>{tr("~SIMULATION.COMPLEXITY.EXPANDED")}</span>
          </label>
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

        <div className="run-panel">
          <div className="title">{tr("~SIMULATION.VIEW_SETTINGS")}</div>
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
          {
            urlParams.showTopology
            ? <div><button onClick={this.showTopology}>Show Topology</button></div>
            : ""
          }
          <div className="row">
            <label key="symbols-label">
              <input
                key="symbols-checkbox"
                type="checkbox"
                value="relationship-symbols"
                checked={this.state.guide}
                onChange={this.handleGuide}
              />
              {tr("~SIMULATION.GUIDE")}
              {this.state.guide
                ? <span> (<span className="link" onClick={this.handleConfigureGuide}>{tr("~SIMULATION.CONFIGURE_GUIDE")}</span>)</span>
                : ""
              }
            </label>
          </div>
        </div>
      </div>
    );
  }
  private showTopology = (e) => {
    const state = GraphStore.serializeGraph({});
    alert(JSON.stringify(state.topology, null, 3));
  }

  private handleCapNodeValues = (e) => {
    SimulationActions.capNodeValues(e.target.checked);
  }

  private handleRelationshipSymbols = (e) => {
    AppSettingsActions.relationshipSymbols(e.target.checked);
  }

  private handleGuide = (e) => {
    AppSettingsActions.guide(e.target.checked);
    if (!e.target.checked) {
      this.codapConnect.hideGuide();
    }
  }

  private handleConfigureGuide = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    this.codapConnect.openGuideConfiguration();
  }

  private handleSimulationType = (val) => {
    AppSettingsActions.setSimulationType(val);
    if ((val === SimulationType.diagramOnly) && GraphStore.allLinksAreUndefined()) {
      AppSettingsActions.setComplexity(Complexity.basic);
    }
  }

  private handleComplexity = (val) => {
    AppSettingsActions.setComplexity(val);
  }
}
