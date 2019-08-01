import * as React from "react";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { SimulationActions, SimulationMixin, SimulationMixinState, SimulationMixinProps } from "../stores/simulation-store";
import { AppSettingsStore, AppSettingsMixin, AppSettingsMixinProps, AppSettingsMixinState } from "../stores/app-settings-store";
import { tr } from "../utils/translate";

import { Mixer } from "../mixins/components";
import { Node } from "../models/node";
import { GraphStoreClass } from "../stores/graph-store";
<<<<<<< HEAD
import { stepSize } from "../utils/step-size";
import { toFixedTrimmed } from "../utils/to-fixed-trimmed";
=======
import { ENABLE_ALL_BELOW_ZERO } from "../utils/url-params";
>>>>>>> Added enableAllBelowZero url param [#164295027]

interface NodeValueInspectorViewOuterProps {

  node: Node;
  graphStore: GraphStoreClass;
}
interface NodeValueInspectorViewOuterState {
  "editing-min": boolean;
  "editing-max": boolean;
  "min-value": number;
  "max-value": number;
}

type NodeValueInspectorViewProps = NodeValueInspectorViewOuterProps & SimulationMixinProps & AppSettingsMixinProps;
type NodeValueInspectorViewState = NodeValueInspectorViewOuterState & SimulationMixinState & AppSettingsMixinState;

export class NodeValueInspectorView extends Mixer<NodeValueInspectorViewProps, NodeValueInspectorViewState> {

  public static displayName = "NodeValueInspectorView";

  private input: HTMLInputElement | null;

  constructor(props: NodeValueInspectorViewProps) {
    super(props);
    this.mixins = [new SimulationMixin(this), new AppSettingsMixin(this)];
    const outerState: NodeValueInspectorViewOuterState = {
      "editing-min": false,
      "editing-max": false,
      "min-value": this.props.node.min,
      "max-value": this.props.node.max
    };
    this.setInitialState(outerState, SimulationMixin.InitialState(), AppSettingsMixin.InitialState());
  }

  public componentWillReceiveProps(nextProps, nextContext) {
    // for mixins...
    super.componentWillReceiveProps(nextProps, nextContext);

    // min and max are copied to state to disconnect the state and property, so
    // that we can set the text field and only update the model when the input field
    // is blured. This way we don't perform min/max validation while user is typing
    return this.setState({
      "min-value": nextProps.node.min,
      "max-value": nextProps.node.max
    });
  }

  public render() {
    const { node } = this.props;
    const { initialValue, min, max } = node;
    const value = toFixedTrimmed(initialValue, 2);
    return (
      <div className="value-inspector">
        <div className="inspector-content group">
          <div className="full">
            {!node.valueDefinedSemiQuantitatively ?
              <span className="full">
                <label className="right">{tr("~NODE-VALUE-EDIT.INITIAL-VALUE")}</label>
                <input
                  className="left"
                  type="number"
                  min={min}
                  max={max}
                  value={value}
                  onClick={this.handleSelectText}
                  onChange={this.handleUpdateValue}
                />
              </span> : undefined}
            <div className="slider group full">
              <input
                className="full"
                type="range"
                min={min}
                max={max}
                step={stepSize({min, max})}
                value={value}
                onChange={this.handleUpdateValue}
              />
              {this.renderMinAndMax(node)}
            </div>
          </div>
          {ENABLE_ALL_BELOW_ZERO || !node.isTransfer ? this.renderCollectorOptions(node) : undefined}
        </div>

        <div className="bottom-pane">
          <p>
            {node.valueDefinedSemiQuantitatively ? tr("~NODE-VALUE-EDIT.DEFINING_WITH_WORDS") :  tr("~NODE-VALUE-EDIT.DEFINING_WITH_NUMBERS")}
          </p>
          <p>
            <label className="node-switch-edit-mode" onClick={this.handleUpdateDefiningType}>
              {node.valueDefinedSemiQuantitatively ? tr("~NODE-VALUE-EDIT.SWITCH_TO_DEFINING_WITH_NUMBERS") : tr("~NODE-VALUE-EDIT.SWITCH_TO_DEFINING_WITH_WORDS")}
            </label>
          </p>
        </div>
      </div>
    );
  }

  private renderEditableProperty(property, classNames) {
    const handleSwapState = () => {
      const editing = !!this.state[`editing-${property}`];
      const focus = () => this.input && this.input.focus();
      // first copy state value to model if we were editing
      if (editing) {
        this.props.graphStore.changeNodeProperty(property, this.state[`${property}-value`], this.props.node);
      }
      if (property === "min") {
        this.setState({"editing-min": !editing}, focus);
      } else {
        this.setState({"editing-max": !editing}, focus);
      }
    };

    const handleUpdateProperty = (evt) => {
      // just update internal state while typing
      const value = parseFloat(evt.target.value);
      if (value != null) {
        if (property === "min") {
          this.setState({"min-value": value});
        } else {
          this.setState({"max-value": value});
        }
      }
    };

    const keyDown = (evt) => {
      if (evt.key === "Enter") {
        return handleSwapState();
      }
    };

    if (!this.state[`editing-${property}`]) {
      return <div className={`half small editable-prop ${classNames}`} onClick={handleSwapState}>{this.state[`${property}-value`]}</div>;
    } else {
      return (
        <input
          className={`half small editable-prop ${classNames}`}
          type="number"
          value={this.state[`${property}-value`]}
          onChange={handleUpdateProperty}
          onBlur={handleSwapState}
          onKeyDown={keyDown}
          ref={el => this.input = el}
        />
      );
    }
  }

  private renderMinAndMax(node) {
    if (node.valueDefinedSemiQuantitatively) {
      return (
        <div className="group full">
          <label className="left half small">{tr("~NODE-VALUE-EDIT.LOW")}</label>
          <label className="right half small">{tr("~NODE-VALUE-EDIT.HIGH")}</label>
        </div>
      );
    } else {
      return (
        <div className="group full">
          {this.renderEditableProperty("min", "left")}
          {this.renderEditableProperty("max", "right")}
        </div>
      );
    }
  }

  private renderCollectorOptions(node) {
    if (this.state.simulationType !== AppSettingsStore.SimulationType.time) {
      return null;
    }

    const isChecked = !this.state.capNodeValues && node.allowNegativeValues;
    const tooltip = this.state.capNodeValues
      ? tr("~NODE-VALUE-EDIT.RESTRICT_POSITIVE_DISABLED_TOOLTIP")
      : (isChecked
        ? tr("~NODE-VALUE-EDIT.RESTRICT_POSITIVE_CHECKED_TOOLTIP")
        : tr("~NODE-VALUE-EDIT.RESTRICT_POSITIVE_UNCHECKED_TOOLTIP"));
    const positiveCheckbox = (
      <label
        className={this.state.capNodeValues ? "disabled" : ""}
        title={tooltip}
        key="positive-label"
      >
        <input
          key="positive-checkbox"
          type="checkbox"
          checked={isChecked}
          disabled={this.state.capNodeValues}
          onChange={this.state.capNodeValues ? undefined : this.handleUpdateNegativeValuesAllowed}
        />
        {tr("~NODE-VALUE-EDIT.RESTRICT_POSITIVE")}
      </label>
    );

    return (
      <span className="checkbox group full">
      {!node.isTransfer ?
        <label key="accumulator-label">
          <input
            key="accumulator-checkbox"
            type="checkbox"
            checked={node.isAccumulator}
            onChange={this.handleUpdateAccumulatorChecked}
          />
          {tr("~NODE-VALUE-EDIT.IS_ACCUMULATOR")}
        </label> : null}
        {ENABLE_ALL_BELOW_ZERO || node.isAccumulator ? positiveCheckbox : undefined}
      </span>
    );
  }

  private trim(inputValue) {
    return Math.max(this.props.node.min, Math.min(this.props.node.max, inputValue));
  }

  private handleUpdateValue = (evt) => {
    let value;
    if (this.state.modelIsRunning && !this.props.node.canEditValueWhileRunning()) {
      // don't do anything; effectively disables slider
      return;
    }

    if (value = evt.target.value) {
      value = this.trim(parseFloat(value));
      return this.props.graphStore.changeNode({initialValue: value});
    }
  }

  private handleUpdateAccumulatorChecked = (evt) => {
    const value = evt.target.checked;
    this.props.graphStore.changeNode({isAccumulator: value});
    return SimulationActions.toggledCollectorTo(value);
  }

  private handleUpdateNegativeValuesAllowed = (evt) => {
    const value = evt.target.checked;
    this.props.graphStore.changeNode({allowNegativeValues: value});
    return SimulationActions.toggledAllowNegativeValues(value);
  }

  private handleUpdateDefiningType = () => {
    this.props.graphStore.changeNode({valueDefinedSemiQuantitatively: !this.props.node.valueDefinedSemiQuantitatively});
  }

  private handleSelectText = (evt) => {
    evt.target.select();
  }
}
