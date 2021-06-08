const _ = require("lodash");
const log = require("loglevel");

import * as React from "react";
import * as $ from "jquery";

import { getViewScale } from "../utils/scale-app";

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
import { Node } from "../models/node";
import { GraphStoreClass } from "../stores/graph-store";
import { SelectionManager } from "../models/selection-manager";
import { stepSize } from "../utils/step-size";
import { logEvent } from "../utils/logger";
import { TransferModel } from "../models/transfer";

interface NodeTitleViewOuterProps {
  isEditing: boolean;
  selected: boolean;
  hovering: boolean;
  isTransfer: boolean;
  node: Node;
  graphStore: GraphStoreClass;
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
    this.nodeTitleMixin = new NodeTitleMixin(this);
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
    // don't show default transfer titles when not editing or hovering
    const { selected, isTransfer, isEditing, hovering, node } = this.props;
    if (!selected && !hovering && !isEditing && isTransfer && (node as TransferModel).isDefaultTransferTitle()) {
      return null;
    }

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
        style={{ display: this.props.isEditing ? "none" : "block" }}
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
        return this.props.graphStore.removeNode(this.props.nodeKey, { logEvent: true });
      }
      // 13 is enter
    } else if (e.which === 13) {
      return this.handleFinishEditing();
      // 27 is escape
    } else if (e.which === 27) {
      return this.setState({ isCancelled: true }, () => this.handleFinishEditing());
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

interface NodeViewHandlerOptions {
  nodeKey: string;
  reactComponent: NodeView;
  domElement: HTMLDivElement | null;
  syntheticEvent: any; // checked: any ok
  extra?: any; // checked: any ok
}

interface NodeViewProps {
  data: Node;
  nodeKey: string;
  simulating: boolean;
  showGraphButton: boolean;
  editTitle: boolean;
  graphStore: GraphStoreClass;
  dataColor: string;
  isTimeBased: boolean;
  innerColor: string;
  selectionManager?: SelectionManager;
  selected: boolean;
  animateGraphs: boolean;
  hideGraphs: boolean;
  onMove: (options: NodeViewHandlerOptions) => void;
  onMoveComplete: (options: NodeViewHandlerOptions) => void;
  onDelete: (options: NodeViewHandlerOptions) => void;
  onSliderDragStart?: (key: string) => void;
  onSliderDragEnd?: (key: string) => void;
}

interface NodeViewState {
  editingNodeTitle: boolean;
  ignoreDrag: boolean;
  isTransfer: boolean;
  hovering: boolean;
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
      isTransfer: this.props.data.isTransfer,
      hovering: false
    };
  }

  public componentDidUpdate() {
    const handle = this.props.selected ? ".selected-background" : ".img-background";
    const $elem = $(this.node!);
    return ($elem as any).draggable("option", "handle", handle);
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

    // NOTE: the div.node-container is needed below to ensure jq-plumb positions the arrows correctly
    return (
      <div className={this.nodeClasses()} ref={el => this.node = el} style={style}>
        <div className={this.linkTargetClasses()} data-node-key={this.props.nodeKey}>
          <div className="node-container" onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut}>
            <div className="slider" data-node-key={this.props.nodeKey}>
              {this.props.simulating && this.props.data.canEditInitialValue() && <div>{this.renderSliderView()}</div>}
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
                  {this.props.selected &&
                    <div className="selected-background" />
                  }
                </div>
                <div draggable={this.props.showGraphButton} onDragStart={handleDragStart}>
                  <NodeTitleView
                    isEditing={this.props.editTitle}
                    title={this.props.data.title}
                    onChange={this.handleChangeTitle}
                    onStopEditing={this.handleStopEditing}
                    onStartEditing={this.handleStartEditing}
                    node={this.props.data}
                    nodeKey={this.props.nodeKey}
                    graphStore={this.props.graphStore}
                    selected={this.props.selected}
                    hovering={this.state.hovering}
                    isTransfer={this.state.isTransfer}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderSliderView() {
    const { min, max } = this.props.data;
    return (
      <SVGSliderView
        orientation="vertical"
        filled={true}
        height={44}
        width={15}
        showHandle={true}
        showLabels={false}
        onValueChange={this.handleChangeValue}
        value={this.props.data.initialValue}
        displaySemiQuant={this.props.data.valueDefinedSemiQuantitatively}
        max={max}
        min={min}
        onSliderDragStart={this.handleSliderDragStart}
        onSliderDragEnd={this.handleSliderDragEnd}
        color={this.props.dataColor}
        handleSize={16}
        stepSize={stepSize({ min, max })}
        showTicks={false}
        displayPrecision={0}
        renderValueTooltip={true}
        minLabel={null}
        maxLabel={null}
        nudge={this.handleNudge}
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
        const outLinks = node.outLinks();
        const hasAddedToLink = _.filter(outLinks, link => link.relation.formula === "+in").length > 0;
        const hasSubtractedFromLink = _.filter(outLinks, link => link.relation.formula === "-in").length > 0;
        const image = node.isTransfer || hasAddedToLink || hasSubtractedFromLink ? "img/nodes/transfer.png" : node.image;
        return (
          <SquareImageView image={image} />
        );
      }
    };

    const nodeImage = getNodeImage(this.props.data);

    if (this.props.data.hasGraphData() || this.props.simulating) {
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
          animateGraphs={this.props.animateGraphs}
          hideGraphs={this.props.hideGraphs}
          usingSlider={this.props.data.usingSlider}
          sliderStartMax={this.props.data.sliderStartMax}
          animateRescale={this.props.data.animateRescale}
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
        InspectorPanelActions.openInspectorPanel("relations");
      }
      return this.lastClickLinkTime = now;
    }
  }

  private handleMove = (evt, extra) => {
    const viewScale = getViewScale();
    extra.position.top /= viewScale;
    extra.position.left /= viewScale;
    extra.offset.top /= viewScale;
    extra.offset.left /= viewScale;

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
    const viewScale = getViewScale();
    extra.position.top /= viewScale;
    extra.position.left /= viewScale;
    extra.offset.top /= viewScale;
    extra.offset.left /= viewScale;

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
    this.props.graphStore.changeNodeWithKey(this.props.nodeKey, { initialValue: newValue }, { logEvent: true });
  }

  private handleChangeTitle = (newTitle, isComplete) => {
    if (isComplete) { newTitle = this.props.graphStore.ensureUniqueTitle(this.props.data, newTitle); }
    this.props.graphStore.startNodeEdit();
    log.info(`Title is changing to ${newTitle}`);
    this.props.graphStore.changeNodeWithKey(this.props.nodeKey, { title: newTitle }, { logEvent: true });
  }

  private handleStartEditing = () => {
    if (this.props.selectionManager && !AppSettingsStore.settings.lockdown) {
      this.initialTitle = this.props.graphStore.nodeKeys[this.props.nodeKey].title;
      return this.props.selectionManager.selectNodeForTitleEditing(this.props.data);
    }
  }

  private handleStopEditing = () => {
    this.props.graphStore.endNodeEdit();
    if (this.props.selectionManager) {
      this.props.selectionManager.clearTitleEditing();
    }
  }

  private isEditing() {
    if (this.props.selectionManager) {
      return this.props.selectionManager.isSelectedForTitleEditing(this.props.data);
    }
  }

  private handleSliderDragStart = () => {
    if (this.props.onSliderDragStart) {
      this.props.onSliderDragStart(this.props.nodeKey);
    }
    return this.setState({ ignoreDrag: true });
  }

  private handleSliderDragEnd = () => {
    if (this.props.onSliderDragEnd) {
      this.props.onSliderDragEnd(this.props.nodeKey);
    }
    return this.setState({ignoreDrag: false});
  }

  private handleGraphClick = (attributeName) => {
    const codapConnect = CodapConnect.instance(DEFAULT_CONTEXT_NAME);
    codapConnect.createGraph(attributeName);
    logEvent("graph created", { horizontal: codapConnect.getTimeUnit(), vertical: attributeName });
  }

  private handleCODAPAttributeDrag = (evt, attributeName) => {
    evt.dataTransfer.effectAllowed = "moveCopy";
    // IE only allows text or URL for the argument type and throws an error for other types
    try {
      evt.dataTransfer.setData("text", attributeName);
      evt.dataTransfer.setData("text/html", attributeName);
      evt.dataTransfer.setData(`application/x-codap-attr-${attributeName}`, attributeName);
    } catch (e) {
      // to make linter happy with empty block
    }
    // CODAP sometimes seems to expect an SC.Array object with a `contains` method, so this avoids a potential error
    return evt.dataTransfer.contains = () => false;
  }

  private handleNudge = (delta: number) => {
    this.props.graphStore.nudgeNodeWithKeyInitialValue(this.props.nodeKey, delta);
  }

  private handleMouseOver = () => {
    this.setState({ hovering: true });
  }

  private handleMouseOut = (e) => {
    // keep hovering until the mouse leaves the container element
    let target = e.toElement || e.relatedTarget;
    while (target && target.parentNode) {
      if (target.parentNode === e.currentTarget) {
        e.preventDefault();
        return;
      }
      target = target.parentNode;
    }
    this.setState({ hovering: false });
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

