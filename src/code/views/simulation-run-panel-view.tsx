import * as React from "react";

import { SimulationActions, SimulationMixinProps } from "../stores/simulation-store";
import { AppSettingsMixinProps } from "../stores/app-settings-store";

import { getDefaultLang, tr } from "../utils/translate";
import { RecordButtonView  } from "./record-button-view";
import { DropDownView, DropDownViewItem } from "./dropdown-view";
import { ExperimentPanelView } from "./experiment-panel-view";

import { SimulationMixin, SimulationMixinState } from "../stores/simulation-store";
import { AppSettingsMixin, AppSettingsMixinState } from "../stores/app-settings-store";
import { Mixer } from "../mixins/components";
import { logEvent } from "../utils/logger";


interface SimulationRunPanelViewOuterProps {}
interface SimulationRunPanelViewOuterState {}

type SimulationRunPanelViewProps = SimulationRunPanelViewOuterProps & SimulationMixinProps & AppSettingsMixinProps;
type SimulationRunPanelViewState = SimulationRunPanelViewOuterState & SimulationMixinState & AppSettingsMixinState;

export class SimulationRunPanelView extends Mixer<SimulationRunPanelViewProps, SimulationRunPanelViewState> {

  public static displayName = "SimulationRunPanelView";

  private simulateElt: HTMLDivElement | null;

  constructor(props: SimulationRunPanelViewProps) {
    super(props);
    this.mixins = [new SimulationMixin(this), new AppSettingsMixin(this)];
    const outerState: SimulationRunPanelViewOuterState = {};
    this.setInitialState(outerState, SimulationMixin.InitialState(), AppSettingsMixin.InitialState());
  }

  public render() {
    return (
      <div className="simulation-run-panel">
        {this.renderToggleButton()}
        {this.renderControls()}
      </div>
    );
  }

  private renderToggleButton() {
    const iconClass = this.state.simulationPanelExpanded ? "inspectorArrow-collapse" : "inspectorArrow-expand";
    const defaultLang = getDefaultLang();
    const doNotRotate = (defaultLang === "ko") || (defaultLang === "pl");
    const simText = tr("~DOCUMENT.ACTIONS.SIMULATE");
    const simTextWidth = (this.simulateElt != null) ? this.simulateElt.clientWidth : simText.length * 6;
    const simTextLeft = (simTextWidth / 2) - 6;
    const simStyle = doNotRotate ? {} : { left: simTextLeft };
    return (
      <div className="flow" onClick={this.handleToggle} title={simText}>
        <div className={`toggle-title ${doNotRotate ? "toggle-title-no-rotate" : ""}`} ref={el => this.simulateElt = el} style={simStyle}>{simText}</div>
        <i className={`icon-codap-${iconClass}`} />
      </div>
    );
  }

  private renderControls() {
    let wrapperClasses = "buttons flow";
    if (!this.state.simulationPanelExpanded) { wrapperClasses += " closed"; }
    const disabled = (this.state.isRecording && !this.state.isRecordingOne) || !this.state.modelIsRunnable;
    const experimentDisabled = !this.state.modelIsRunnable || this.state.isRecordingPeriod;
    const onClick = () => {
      SimulationActions.recordOne();
      logEvent("record 1 data point pressed");
    };
    return (
      <div className={wrapperClasses}>
        <div className="vertical">
          <ExperimentPanelView disabled={experimentDisabled} />
          {this.state.isTimeBased
            ? this.renderRecordForCollectors()
            : <div className="horizontal">
                <RecordButtonView
                  onClick={onClick}
                  disabled={disabled}
                  recording={false}
                  includeLight={false}
                >
                  <div className="horizontal">
                    <span>{tr("~DOCUMENT.ACTIONS.DATA.RECORD-1")}</span>
                    <i className="icon-codap-camera" />
                  </div>
                  <div className="horizontal">
                    <span>{tr("~DOCUMENT.ACTIONS.DATA.POINT")}</span>
                  </div>
                </RecordButtonView>
                {this.renderRecordStreamButton()}
              </div>}
        </div>
      </div>
    );
  }

  private renderRecordForCollectors() {
    const onClick = () => {
      if (!this.state.isRecording) {
        SimulationActions.recordPeriod();
        logEvent("record timeseries");
      }
    };

    const props = {
      onClick,
      includeLight: false,
      recording: this.state.isRecording,
      disabled: !this.state.modelIsRunnable
    };
    const {timeUnitOptions} = this.state;
    const items = Object.keys(timeUnitOptions).map((key) => timeUnitOptions[key]);
    return (
      <div className="horizontal">
        <RecordButtonView {...props}>
          <div className="horizontal">
            <span>{tr("~DOCUMENT.ACTIONS.DATA.RECORD")}</span>
            <i className="icon-codap-video-camera" />
          </div>
        </RecordButtonView>
        <input
          type="number"
          min={1}
          max={1000}
          style={{
            width: `${Math.max(3, (this.state.duration.toString().length + 1))}em`
          }}
          value={this.state.duration}
          onChange={this.handleSetDuration}
        />
        <DropDownView
          isActionMenu={false}
          onSelect={SimulationActions.setStepUnits}
          anchor={this.state.stepUnitsName}
          items={items as DropDownViewItem[]}
        />
      </div>
    );
  }

  private renderRecordStreamButton() {
    let recordAction = SimulationActions.recordStream;
    let logParams: object = {started: true};
    if (this.state.isRecording) {
      recordAction = SimulationActions.stopRecording;
      logParams = {stopped: true};
    }

    const onClick = () => {
      recordAction();
      logEvent("record continuously pressed", logParams);
    };

    const props = {
      onClick,
      includeLight: true,
      recording: this.state.isRecordingStream,
      disabled: !this.state.modelIsRunnable || this.state.isRecordingOne
    };

    if (this.state.isRecording) {
      return (
        <RecordButtonView {...props}>
          <div className="horizontal">
            <span>{tr("~DOCUMENT.ACTIONS.DATA.STOP")}</span>
            <i className="icon-codap-video-camera" />
          </div>
          <div className="horizontal">
            <span>{tr("~DOCUMENT.ACTIONS.DATA.RECORDING")}</span>
          </div>
        </RecordButtonView>
      );
    } else {
      return (
        <RecordButtonView {...props}>
          <div className="horizontal">
            <span>{tr("~DOCUMENT.ACTIONS.DATA.RECORD")}</span>
            <i className="icon-codap-video-camera" />
          </div>
          <div className="horizontal">
            <span>{tr("~DOCUMENT.ACTIONS.DATA.CONTINUOUSLY")}</span>
          </div>
        </RecordButtonView>
      );
    }
  }

  private handleSetDuration = (e) => {
    const duration = parseInt(e.target.value, 10);
    SimulationActions.setDuration(duration);
    logEvent("steps changed", {steps: duration});
  }

  private handleToggle = () => {
    const logParams = this.state.simulationPanelExpanded ? {closed: true} : {opened: true};
    if (this.state.simulationPanelExpanded) {
      SimulationActions.collapseSimulationPanel();
    } else {
      SimulationActions.expandSimulationPanel();
    }
    logEvent("simulate pressed", logParams);
  }
}
