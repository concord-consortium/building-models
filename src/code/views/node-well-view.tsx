import * as React from "react";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { PaletteInspectorView } from "./palette-inspector-view";
import { PaletteMixinProps, PaletteMixinState, PaletteMixin } from "../stores/palette-store";
import { Mixer } from "../mixins/components";

interface NodeWellViewOuterProps {
  uiElements: any; // TODO: get concrete type
  toggleImageBrowser: () => void;
  graphStore: any; // TODO: get concrete type
}
interface NodeWellViewOuterState {
  nodes: any[]; // TODO: get concrete type
  collapsed: boolean;
}

type NodeWellViewProps = NodeWellViewOuterProps & PaletteMixinProps;
type NodeWellViewState = NodeWellViewOuterState & PaletteMixinState;

export class NodeWellView extends Mixer<NodeWellViewProps, NodeWellViewState> {

  public static displayName = "NodeWellView";

  constructor(props: NodeWellViewProps) {
    super(props);
    this.mixins = [new PaletteMixin(this, props)];
    const outerState: NodeWellViewOuterState = {
      nodes: [],
      collapsed: true
    };
    this.setInitialState(outerState, PaletteMixin.InitialState);
  }

  public render() {
    let topNodePaletteClass    = "top-node-palette-wrapper";
    let topNodeTabPaletteClass = "top-node-palette-tab";
    if (this.state.collapsed) {
      topNodePaletteClass    = "top-node-palette-wrapper collapsed";
      topNodeTabPaletteClass = "top-node-palette-tab collapsed";
    }

    return (
      <div className={this.props.uiElements.nodePalette === false ? "wrapperwrapper hidden" : this.props.uiElements.globalNav === false ? "wrapperwrapper top" : "wrapperwrapper"}>
        <div className={topNodePaletteClass}>
          <PaletteInspectorView
            // TODO: these props were in the coffee code but don't exist
            // toggleImageBrowser={this.props.toggleImageBrowser}
            // graphStore={this.props.graphStore}
          />
        </div>
        <div className="tab-wrapper">
          <div className={topNodeTabPaletteClass} onClick={this.handleToggle} />
        </div>
      </div>
    );
  }

  private handleToggle = () => {
    return this.setState({collapsed: !this.state.collapsed});
  }
}
