const _ = require("lodash");
const log = require("loglevel");

import * as React from "react";
import * as $ from "jquery";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { tr } from "../utils/translate";

import { AppSettingsStore } from "../stores/app-settings-store";
import { SquareImageView } from "./square-image-view";
import { StackedImageView } from "./stacked-image-view";
import { SVGSliderView } from "./value-slider-view";
import { NodeSvgGraphView } from "./node-svg-graph-view";
import { CodapConnect } from "../models/codap-connect";
const DEFAULT_CONTEXT_NAME = "building-models";

import { NodeTitleMixinState, NodeTitleMixinProps, NodeTitleMixin } from "../mixins/node-title";

import { InspectorPanelActions } from "../stores/inspector-panel-store";
import { Mixer } from "../mixins/components";

interface NodeTitleViewOuterProps {
  isEditing: boolean;
  node: any; // TODO: get concrete type
  onNodeChanged?: (node: any, newValue: any) => void; // TODO: get concrete type
  onNodeDelete?: (node: any) => void; // TODO: get concrete type
  graphStore: any; // TODO: get concrete type
  nodeKey: string;
  onStartEditing: () => void;
  onStopEditing: () => void;
  onChange: (title: string, finished: boolean) => void;
}
interface NodeTitleViewOuterState {
  title: string;
  isUniqueTitle: boolean;
  isCancelled: boolean;
}

type NodeTitleViewProps = NodeTitleViewOuterProps & NodeTitleMixinProps;
type NodeTitleViewState = NodeTitleViewOuterState & NodeTitleMixinState;

class NodeTitleView extends Mixer<NodeTitleViewProps, NodeTitleViewState> {

  public static displayName = "NodeTitle";

  private nodeTitleMixin: NodeTitleMixin;
  private titleUpdated: boolean;
  private input: HTMLInputElement | null;

  constructor(props: NodeTitleViewProps) {
    super(props);
    this.nodeTitleMixin = new NodeTitleMixin(this, props);
    this.mixins = [this.nodeTitleMixin];

    const outerState: NodeTitleViewOuterState = this.getStateFromProps(props);
    this.setInitialState(outerState, NodeTitleMixin.InitialState());
  }

  public componentWillUnmount() {
    // for mixins
    super.componentWillUnmount();

    if (this.props.isEditing) {
      return this.inputElm().off();
    }
  }

  public componentWillUpdate(nextProps, nextState, nextContext) {
    // for mixins
    super.componentWillUpdate(nextProps, nextState, nextContext);

    if (this.props.isEditing && !nextProps.isEditing) {
      // mark the title as updated even if no change was made when it leaves edit mode
      return this.titleUpdated = true;
    } else if (!this.props.isEditing && nextProps.isEditing) {
      // reset title state based on node title
      return this.setState(this.getStateFromProps(nextProps));
    }
  }

  public componentDidUpdate(prevProps, prevState, prevContext) {
    // for mixins
    super.componentDidUpdate(prevProps, prevState, prevContext);

    if (this.props.isEditing) {
      const $elem = this.inputElm();
      return $elem.focus();
    }
  }

  public render() {
    return (
      <div className="node-title-box">
        {this.renderTitle()}
        {this.renderTitleInput()}
      </div>
    );
  }

  private renderTitle() {
    return (
      <div
        className={`node-title${this.nodeTitleMixin.isDefaultTitle() ? " untitled" : ""}`}
        key="display"
        style={{display: this.props.isEditing ? "none" : "block" }}
        onClick={this.props.onStartEditing}
      >
        {this.props.title}
      </div>
    );
  }

  private renderTitleInput() {
    const displayTitle = this.nodeTitleMixin.displayTitleForInput(this.state.title);
    const className = `node-title${!this.state.isUniqueTitle ? " non-unique-title" : ""}`;
    return (
      <input
        type="text"
        ref={el => this.input = el}
        key="edit"
        style={{ display: this.props.isEditing ? "block" : "none" }}
        className={className}
        onKeyUp={this.props.isEditing ? this.handleKeyUp : undefined}
        onChange={this.handleChange}
        value={displayTitle}
        maxLength={this.nodeTitleMixin.maxTitleLength()}
        placeholder={this.nodeTitleMixin.titlePlaceholder()}
        onBlur={this.handleFinishEditing}
      />
    );
  }

  private isUniqueTitle(title, props?) {
    return this.props.graphStore.isUniqueTitle(title, (props || this.props).node);
  }

  private getStateFromProps(props: NodeTitleViewProps): NodeTitleViewState {
    return {
      title: props.node.title,
      isUniqueTitle: this.isUniqueTitle(props.node.title, props),
      isCancelled: false
    };
  }

  private inputElm() {
    return $(this.input!);
  }

  private inputValue() {
    return this.inputElm().val();
  }

  private handleKeyUp = (e) => {
    // 8 is backspace, 46 is delete
    if (_.includes([8, 46], e.which) && !this.titleUpdated) {
      const canDeleteWhenEmpty = this.props.node.addedThisSession && !this.titleUpdated;
      if (canDeleteWhenEmpty) {
        return this.props.graphStore.removeNode(this.props.nodeKey);
      }
    // 13 is enter
    } else if (e.which === 13) {
      return this.handleFinishEditing();
    // 27 is escape
    } else if (e.which === 27) {
      return this.setState({isCancelled: true}, () => this.handleFinishEditing());
    }
  }

  private handleChange = () => {
    this.updateTitle();
  }

  private updateTitle(isComplete?, callback?) {
    this.titleUpdated = true;
    const title = this.state.isCancelled ? this.props.node.title : this.inputValue();
    const newTitle = this.nodeTitleMixin.cleanupTitle(title, isComplete);
    const newState = {
      title: newTitle,
      isUniqueTitle: this.isUniqueTitle(newTitle)
    };
    return this.setState(newState, callback);
  }

  private handleFinishEditing = () => {
    return this.updateTitle(true, () => {
      if (!this.state.isCancelled) { this.props.onChange(this.state.title, true); }
      return this.props.onStopEditing();
    });
  }
}

interface NodeViewProps {
  data: any; // TODO: get concrete type
  nodeKey: string;
  simulating: boolean;
  showGraphButton: boolean;
  editTitle: boolean;
  graphStore: any; // TODO: get concrete type
  dataColor: string;
  showMinigraph: boolean;
  isTimeBased: boolean;
  innerColor: string;
  selectionManager?: any; // TODO: get concrete type
  selected: boolean;
  onMove: (data: any) => void;
  onMoveComplete: (data: any) => void;
  onDelete: (data: any) => void;
}

interface NodeViewState {
  editingNodeTitle: boolean;
  ignoreDrag: boolean;
  isTransfer: boolean;
}

export class NodeView extends React.Component<NodeViewProps, NodeViewState> {

    /*
  getDefaultProps() {
    return {
      onMove() { return log.info("internal move handler"); },
      onStop() { return log.info("internal move handler"); },
      onDelete() { return log.info("internal on-delete handler"); },
      onSelect() { return log.info("internal select handler"); },
      selected: false,
      simulating: false,
      value: null,
      dataColor: "#aaa",
      data: {
        title: "foo",
        x: 10,
        y: 10,
        color: "dark-blue"
      }
    };
  },
  */


  public static displayName = "NodeView";

  public static nodeImageOffset: () => any;

  private lastClickLinkTime;
  private initialTitle: string;
  private node: HTMLDivElement | null;

  constructor(props: NodeViewProps) {
    super(props);
    this.state = {
      editingNodeTitle: false,
      ignoreDrag: false,
      isTransfer: this.props.data.isTransfer
    };
  }

  public componentDidUpdate() {
    const handle = ".img-background";
    const $elem = $(this.node!);
    return ($elem as any).draggable( "option", "handle", handle);
  }

  public componentDidMount() {
    const $elem = $(this.node!);
    return ($elem as any).draggable({
      drag: this.handleMove,
      stop: this.handleStop,
      containment: "parent"
    });
  }

  public render() {
    const style = {
      top: this.props.data.y,
      left: this.props.data.x,
      color: this.props.data.color
    };
    const fullWidthBackgroundClass = this.props.data.isTransfer ? "full-width" : "";

    const handleDragStart = evt => this.handleCODAPAttributeDrag(evt, this.props.data.codapID);
    const handleGraphButtonClick = () => this.handleGraphClick(this.props.data.title);
    const handleBackgroundClick = evt => this.handleSelected(true, evt);
    const handleBackgroundTouchEnd = () => this.handleSelected(true);

    return (
      <div className={this.nodeClasses()} ref={el => this.node = el} style={style}>
        <div className={this.linkTargetClasses()} data-node-key={this.props.nodeKey}>
          <div className="slider" data-node-key={this.props.nodeKey}>
            {this.props.simulating ? <div>{this.renderSliderView()}</div> : undefined}
          </div>
          <div>
            <div className="actions">
              <div className="connection-source action-circle icon-codap-link" data-node-key={this.props.nodeKey} />
              {this.props.showGraphButton ?
                <div
                  className="graph-source action-circle icon-codap-graph"
                  draggable={true}
                  onDragStart={handleDragStart}
                  onClick={handleGraphButtonClick}
                /> : undefined}
            </div>
            <div className={this.topClasses()} data-node-key={this.props.nodeKey}>
              <div
                className={`img-background transfer-target ${fullWidthBackgroundClass}`}
                onClick={handleBackgroundClick}
                onTouchEnd={handleBackgroundTouchEnd}
              >
                {this.renderNodeInternal()}
              </div>
              {this.props.data.isTransfer
                ? <div className="node-title" />
                : <div draggable={this.props.showGraphButton} onDragStart={handleDragStart}>
                    <NodeTitleView
                      isEditing={this.props.editTitle}
                      title={this.props.data.title}
                      onChange={this.handleChangeTitle}
                      onStopEditing={this.handleStopEditing}
                      onStartEditing={this.handleStartEditing}
                      node={this.props.data}
                      nodeKey={this.props.nodeKey}
                      graphStore={this.props.graphStore}
                    />
                  </div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderValue() {
    let value = this.props.data.value || this.props.data.initialValue;
    value = Math.round(value);
    return (
      <div className="value">
        <label>{tr("~NODE.SIMULATION.VALUE")}</label>
        <input type="text" className="value" value={value} />
      </div>
    );
  }

  private renderSliderView() {
    const showHandle = this.props.data.canEditInitialValue();
    let value = this.props.data.currentValue != null ? this.props.data.currentValue : this.props.data.initialValue;
    if (showHandle) {
      value = this.props.data.initialValue;
    }

    return (
      <SVGSliderView
        orientation="vertical"
        filled={true}
        height={44}
        width={15}
        showHandle={showHandle}
        showLabels={false}
        onValueChange={this.handleChangeValue}
        value={value}
        displaySemiQuant={this.props.data.valueDefinedSemiQuantitatively}
        max={this.props.data.max}
        min={this.props.data.min}
        onSliderDragStart={this.handleSliderDragStart}
        onSliderDragEnd={this.handleSliderDragEnd}
        color={this.props.dataColor}
        handleSize={16}
        stepSize={1}
        showTicks={false}
        displayPrecision={0}
        renderValueTooltip={true}
        minLabel={null}
        maxLabel={null}
      />
    );
  }

  private renderNodeInternal() {
    const getNodeImage = (node) => {
      if (node.isAccumulator) {
        return (
          <StackedImageView
            image={node.image}
            imageProps={node.collectorImageProps()}
          />
        );
      } else {
        return (
          <SquareImageView
            image={node.isTransfer ? "img/nodes/transfer.png" : node.image}
          />
        );
      }
    };

    const nodeImage = getNodeImage(this.props.data);

    if (this.props.showMinigraph) {
      return (
        <NodeSvgGraphView
          isTimeBased={this.props.isTimeBased}
          min={this.props.data.min}
          max={this.props.data.max}
          data={this.props.data.frames}
          currentValue={this.props.data.currentValue}
          color={this.props.dataColor}
          innerColor={this.props.innerColor}
          image={nodeImage}
          width={48}
          height={48}
          strokeWidth={3}
        />
      );
    } else {
      return nodeImage;
    }
  }

  private handleSelected = (actually_select, evt?) => {
    if (!this.props.selectionManager) { return; }

    const selectionKey = actually_select ? this.props.nodeKey : "dont-select-anything";
    const multipleSelections = evt && (evt.ctrlKey || evt.metaKey || evt.shiftKey);
    this.props.selectionManager.selectNodeForInspection(this.props.data, multipleSelections);

    // open the relationship panel on double click if the node has incombing links
    if (this.props.data.inLinks().length > 0) {
      const now = (new Date()).getTime();
      if ((now - (this.lastClickLinkTime || 0)) <= 250) {
        // Only open inspector if we're not in diagram-only mode
        if (AppSettingsStore.settings.simulationType !== AppSettingsStore.SimulationType.diagramOnly) {
          InspectorPanelActions.openInspectorPanel("relations");
        }
      }
      return this.lastClickLinkTime = now;
    }
  }

  private handleMove = (evt, extra) => {
    this.props.onMove({
      nodeKey: this.props.nodeKey,
      reactComponent: this,
      domElement: this.node,
      syntheticEvent: evt,
      extra
    });

    // returning false will cancel the drag
    return !this.state.ignoreDrag;
  }

  private handleStop = (evt, extra) => {
    return this.props.onMoveComplete({
      nodeKey: this.props.nodeKey,
      reactComponent: this,
      domElement: this.node,
      syntheticEvent: evt,
      extra
    });
  }

  private handleDelete = (evt) => {
    return this.props.onDelete({
      nodeKey: this.props.nodeKey,
      reactComponent: this,
      domElement: this.node,
      syntheticEvent: evt
    });
  }

  private handleChangeValue = (newValue) => {
    return this.props.graphStore.changeNodeWithKey(this.props.nodeKey, {initialValue: newValue});
  }

  private handleChangeTitle = (newTitle, isComplete) => {
    if (isComplete) { newTitle = this.props.graphStore.ensureUniqueTitle(this.props.data, newTitle); }
    this.props.graphStore.startNodeEdit();
    log.info(`Title is changing to ${newTitle}`);
    return this.props.graphStore.changeNodeWithKey(this.props.nodeKey, {title: newTitle});
  }

  private handleStartEditing = () => {
    if (!AppSettingsStore.settings.lockdown) {
      this.initialTitle = this.props.graphStore.nodeKeys[this.props.nodeKey].title;
      return this.props.selectionManager.selectNodeForTitleEditing(this.props.data);
    }
  }

  private handleStopEditing = () => {
    this.props.graphStore.endNodeEdit();
    return this.props.selectionManager.clearTitleEditing();
  }

  private isEditing() {
    return this.props.selectionManager.isSelectedForTitleEditing(this.props.data);
  }

  private handleSliderDragStart = () => {
    return this.setState({ignoreDrag: true});
  }

  private handleSliderDragEnd = () => {
    return this.setState({ignoreDrag: false});
  }

  private handleGraphClick = (attributeName) => {
    const codapConnect = CodapConnect.instance(DEFAULT_CONTEXT_NAME);
    return codapConnect.createGraph(attributeName);
  }

  private handleCODAPAttributeDrag = (evt, attributeName) => {
    evt.dataTransfer.effectAllowed = "moveCopy";
    evt.dataTransfer.setData("text/html", attributeName);
    evt.dataTransfer.setData("text", attributeName);
    evt.dataTransfer.setData(`application/x-codap-attr-${attributeName}`, attributeName);
    // CODAP sometimes seems to expect an SC.Array object with a `contains` method, so this avoids a potential error
    return evt.dataTransfer.contains = () => false;
  }

  private nodeClasses() {
    const classes = ["elm"];
    if (this.props.selected) {
      classes.push("selected");
    }
    return classes.join(" ");
  }

  private topClasses() {
    const classes = ["top"];
    classes.push("link-top");
    return classes.join(" ");
  }

  private linkTargetClasses() {
    const classes = ["link-target"];
    if (this.props.simulating) {
      classes.push("simulate");
    }
    return classes.join(" ");
  }

}

// synchronized with corresponding CSS values
NodeView.nodeImageOffset = () => {
  const linkTargetTopMargin = 6;   // .link-target
  const elementTopMargin = 6;      // .elm .top
  return { left: 0, top: linkTargetTopMargin + elementTopMargin };
};

