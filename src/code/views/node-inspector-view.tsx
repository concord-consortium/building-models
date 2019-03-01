import * as React from "react";

import { tr } from "../utils/translate";
import { ColorPickerView } from "./color-picker-view";
import { ImagePickerView } from "./image-picker-view";
import { NodeTitleMixin, NodeTitleMixinProps, NodeTitleMixinState } from "../mixins/node-title";
import { Mixer } from "../mixins/components";
import { Node } from "../models/node";

interface NodeInspectorViewOuterProps {
  node: Node;
  onNodeChanged?: (node: Node, newValue: any) => void; // TODO: get concrete type
  onNodeDelete?: (node: Node) => void;
}
interface NodeInspectorViewOuterState {}

type NodeInspectorViewProps = NodeInspectorViewOuterProps & NodeTitleMixinProps;
type NodeInspectorViewState = NodeInspectorViewOuterState & NodeTitleMixinState;

export class NodeInspectorView extends Mixer<NodeInspectorViewProps, NodeInspectorViewState> {

  public static displayName = "NodeInspectorView";

  private nodeTitleMixin: NodeTitleMixin;

  constructor(props: NodeInspectorViewProps) {
    super(props);
    this.nodeTitleMixin = new NodeTitleMixin(this);
    this.mixins = [this.nodeTitleMixin];

    const outerState: NodeInspectorViewOuterState = {};
    this.setInitialState(outerState, NodeTitleMixin.InitialState());
  }

  public render() {
    return (
      <div className="node-inspector-view">
        <div className="inspector-content">
          {!this.props.node.isTransfer ? this.renderForm() : undefined}
          <div className="edit-row">
            <label className="node-delete" onClick={this.handleDelete}>
              <i className="icon-codap-trash" />
              {tr("~NODE-EDIT.DELETE")}
            </label>
          </div>
        </div>
      </div>
    );
  }

  private renderForm() {
    const displayTitle = this.nodeTitleMixin.displayTitleForInput(this.props.node.title);
    return (
      <div>
        <div className="edit-row">
          <label htmlFor="title">{tr("~NODE-EDIT.TITLE")}</label>
          <input type="text" name="title" value={displayTitle} placeholder={this.nodeTitleMixin.titlePlaceholder()} onChange={this.handleChangeTitle} />
        </div>
        <div className="edit-row">
          <label htmlFor="color">{tr("~NODE-EDIT.COLOR")}</label>
          <ColorPickerView selected={this.props.node.color} onChange={this.handleChangeColor} />
        </div>
        <div className="edit-row">
          <label htmlFor="image">{tr("~NODE-EDIT.IMAGE")}</label>
          <ImagePickerView selected={this.props.node} onChange={this.handleChangeImage} />
        </div>
      </div>
    );
  }

  private handleChangeTitle = (e) => {
    if (this.props.onNodeChanged) {
      const newTitle = this.nodeTitleMixin.cleanupTitle(e.target.value);
      this.props.onNodeChanged(this.props.node, {title: newTitle});
    }
  }

  private handleChangeImage = (node) => {
    if (this.props.onNodeChanged) {
      this.props.onNodeChanged(this.props.node, {image: node.image, paletteItem: node.uuid});
    }
  }

  private handleChangeColor = (color) => {
    if (this.props.onNodeChanged) {
      this.props.onNodeChanged(this.props.node, {color});
    }
  }

  private handleDelete = (e) => {
    if (this.props.onNodeDelete) {
      this.props.onNodeDelete(this.props.node);
    }
  }
}
