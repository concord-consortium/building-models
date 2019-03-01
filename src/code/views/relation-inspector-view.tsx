const _ = require("lodash");
import * as React from "react";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { LinkRelationView } from "./link-relation-view";
import { TabbedPanelView } from "./tabbed-panel-view";

import { RelationFactory } from "../models/relation-factory";
import { tr } from "../utils/translate";

import { InspectorPanelActions, InspectorPanelMixinProps, InspectorPanelMixinState, InspectorPanelMixin } from "../stores/inspector-panel-store";
import { GraphStore, GraphMixin, GraphMixinProps, GraphMixinState } from "../stores/graph-store";
import { Mixer } from "../mixins/components";
import { Link } from "../models/link";
import { Node } from "../models/node";

interface RelationInspectorViewOuterProps {
  node?: Node | null;
  link?: Link | null;
  graphStore: any; // TODO: get concrete type
}
interface RelationInspectorViewOuterState {
}

type RelationInspectorViewProps = RelationInspectorViewOuterProps & InspectorPanelMixinProps & GraphMixinProps;
type RelationInspectorViewState = RelationInspectorViewOuterState & InspectorPanelMixinState & GraphMixinState;

export class RelationInspectorView extends Mixer<RelationInspectorViewProps, RelationInspectorViewState> {

  public static displayName = "RelationInspectorView";

  // listen to graphStore so that the tab for the link will re-render when the link is fully defined
  // (link-relation-view uses @props.graphStore.changeLink() to update the link)
  constructor(props: RelationInspectorViewProps) {
    super(props);
    this.mixins = [new InspectorPanelMixin(this), new GraphMixin(this)];
    const outerState: RelationInspectorViewOuterState = {};
    this.setInitialState(outerState, InspectorPanelMixin.InitialState());
  }

  public render() {
    const {node, link} = this.props;
    if (node) {
      return this.renderNodeRelationInspector(node);
    } else if (link) {
      return this.renderLinkRelationInspector();
    } else {
      return <div />;
    }
  }

  private renderTabforLink(link) {
    const relationView = <LinkRelationView link={link} graphStore={this.props.graphStore} />;
    const label = link.sourceNode.title;
    const {vector, scalar, accumulator, transferModifier} = RelationFactory.selectionsFromRelation(link.relation);
    const isFullyDefined = (link.relation.isDefined && (vector != null) && (scalar != null)) || (link.relation.customData != null) || (accumulator != null) || (transferModifier != null);

    return TabbedPanelView.Tab({label, component: relationView, defined: isFullyDefined});
  }

  // this is passed as a prop so it needs to be bound to this class
  private renderNodeDetailsInspector = () => {
    const {node} = this.props;
    if (node) {
      const inputCount = (node.inLinks() || []).length;
      if (node.isAccumulator || (inputCount < 2)) { return null; }

      const method = node.combineMethod != null ? node.combineMethod : "average";
      return (
        <div className="node-details-inspector" key="details">
          {tr("~NODE-RELATION-EDIT.COMBINATION_METHOD")}
          <select key={0} value={method} onChange={this.handleMethodSelected}>
            <option value="average" key={1}>{tr("~NODE-RELATION-EDIT.ARITHMETIC_MEAN")}</option>
            <option value="product" key={2}>{tr("~NODE-RELATION-EDIT.SCALED_PRODUCT")}</option>
          </select>
        </div>
      );
    }
  }

  private renderNodeRelationInspector(node: Node) {
    let selectedTabIndex = 0;
    const tabs = _.map(node.inLinks(), (link, i) => {
      if (this.state.selectedLink === link) { selectedTabIndex = i; }
      return this.renderTabforLink(link);
    });
    return (
      <div className="relation-inspector">
        <TabbedPanelView
          tabs={tabs}
          selectedTabIndex={selectedTabIndex}
          onTabSelected={this.handleTabSelected}
          onRenderBelowTabsComponent={this.renderNodeDetailsInspector}
        />
      </div>
    );
  }

  private renderLinkRelationInspector() {
    return <div className="relation-inspector" />;
  }

  private handleTabSelected = (index) => {
    const {node} = this.props;
    if (node) {
      InspectorPanelActions.openInspectorPanel("relations", {link: __guard__(node.inLinks(), x => x[index])});
    }
  }

  private handleMethodSelected = (evt) => {
    GraphStore.changeNode({ combineMethod: evt.target.value }, this.props.node);
  }
}

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
