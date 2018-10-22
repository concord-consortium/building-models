/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const SimulationStore = require("../stores/simulation-store");
const AppSettingsStore = require("../stores/app-settings-store");

const tr              = require("../utils/translate");
import { RecordButtonView as RecordButtonViewClass } from "./record-button-view";
const RecordButton    = React.createFactory(RecordButtonViewClass);
import { DropDownView as DropDownViewClass } from "./dropdown-view";
const Dropdown        = React.createFactory(DropDownViewClass);
const ExperimentPanel = React.createFactory(require("./experiment-panel-view"));

const {div, span, i, input}  = React.DOM;

module.exports = React.createClass({

  displayName: "SimulationRunPanel",

  mixins: [ SimulationStore.mixin, AppSettingsStore.mixin ],


  setDuration(e) {
    return SimulationStore.actions.setDuration(parseInt(e.target.value, 10));
  },

  toggle() {
    if (this.state.simulationPanelExpanded) {
      return SimulationStore.actions.collapseSimulationPanel();
    } else {
      return SimulationStore.actions.expandSimulationPanel();
    }
  },
  // -- TBD: There was discussion about automatically showing
  // -- MiniGraphs when this panel is opened  …  NP 2018-01
  // if ! @state.showingMinigraphs
  //   AppSettingsStore.actions.showMinigraphs true

  renderToggleButton() {
    const iconClass = this.state.simulationPanelExpanded ? "inspectorArrow-collapse" : "inspectorArrow-expand";
    const simRefFunc = elt => this.simulateElt = elt;
    const simText = tr("~DOCUMENT.ACTIONS.SIMULATE");
    const simTextWidth = (this.simulateElt != null) ? this.simulateElt.clientWidth : simText.length * 6;
    const simTextLeft = (simTextWidth / 2) - 6;
    const simStyle = { left: simTextLeft };
    return (div({className: "flow", onClick: this.toggle},
      (div({className: "toggle-title", ref: simRefFunc, style: simStyle }, simText)),
      (i({className: `icon-codap-${iconClass}`}))
    ));
  },

  renderControls() {
    let wrapperClasses = "buttons flow";
    if (!this.state.simulationPanelExpanded) { wrapperClasses += " closed"; }
    const disabled = (this.state.isRecording && !this.state.isRecordingOne) || !this.state.modelIsRunnable;
    const experimentDisabled = !this.state.modelIsRunnable || this.state.isRecordingPeriod;
    return (div({className: wrapperClasses},
      (div({className: "vertical" },
        (ExperimentPanel({disabled: experimentDisabled})),
        this.state.isTimeBased ?
          this.renderRecordForCollectors()
          :
          (div({className: "horizontal"},
            (RecordButton({
              onClick: SimulationStore.actions.recordOne,
              disabled
            }
            ,
            (div({className: "horizontal"},
              (span({}, tr("~DOCUMENT.ACTIONS.DATA.RECORD-1"))),
              (i({className: "icon-codap-camera"}))
            )),
            (div({className: "horizontal"},
              (span({}, tr("~DOCUMENT.ACTIONS.DATA.POINT")))
            ))
            )),
            this.renderRecordStreamButton()
          ))
      ))
    ));
  },


  renderRecordForCollectors() {
    let recordAction = SimulationStore.actions.recordPeriod;
    if (this.state.isRecording) {
      recordAction = () => undefined;
    }

    const props = {
      onClick: recordAction,
      includeLight: false,
      recording: this.state.isRecording,
      disabled: !this.state.modelIsRunnable
    };
    return (div({className: "horizontal"},
      (RecordButton(props,
        (div({className: "horizontal"},
          (span({}, tr("~DOCUMENT.ACTIONS.DATA.RECORD"))),
          (i({className: "icon-codap-video-camera"}))
        ))
      )),
      (input({
        type: "number",
        min: 1,
        max: 1000,
        style: {
          width: `${Math.max(3, (this.state.duration.toString().length + 1))}em`
        },
        value: this.state.duration,
        onChange: this.setDuration
      })),
      (Dropdown({
        isActionMenu: false,
        onSelect: SimulationStore.actions.setStepUnits,
        anchor: this.state.stepUnitsName,
        items: this.state.timeUnitOptions
      }))
    ));
  },


  renderRecordStreamButton() {
    let recordAction = SimulationStore.actions.recordStream;
    if (this.state.isRecording) {
      recordAction = SimulationStore.actions.stopRecording;
    }

    const props = {
      onClick: recordAction,
      includeLight: true,
      recording: this.state.isRecordingStream,
      disabled: !this.state.modelIsRunnable || this.state.isRecordingOne
    };

    if (this.state.isRecording) {
      return (RecordButton(props,
        (div({className: "horizontal"},
          (span({}, tr("~DOCUMENT.ACTIONS.DATA.STOP"))),
          (i({className: "icon-codap-video-camera"}))
        )),
        (div({className: "horizontal"},
          (span({}, tr("~DOCUMENT.ACTIONS.DATA.RECORDING")))
        ))
      ));
    } else {
      return (RecordButton(props,
        (div({className: "horizontal"},
          (span({}, tr("~DOCUMENT.ACTIONS.DATA.RECORD"))),
          (i({className: "icon-codap-video-camera"}))
        )),
        (div({className: "horizontal"},
          (span({}, tr("~DOCUMENT.ACTIONS.DATA.STREAM")))
        ))
      ));
    }
  },

  render() {
    return (div({className: "simulation-run-panel"},
      this.renderToggleButton(),
      this.renderControls()
    ));
  }
});
