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

import { InspectorPanelActions, InspectorPanelMixin, InspectorPanelMixin2Props, InspectorPanelMixin2State, InspectorPanelMixin2 } from "../stores/inspector-panel-store";
import { GraphStore, GraphMixin, GraphMixin2, GraphMixin2Props, GraphMixin2State } from "../stores/graph-store";
import { Mixer } from "../mixins/components";

interface RelationInspectorViewOuterProps {
  node?: any; // TODO: get concrete type
  link?: any; // TODO: get concrete type
  graphStore: any; // TODO: get concrete type
}
interface RelationInspectorViewOuterState {
}

type RelationInspectorViewProps = RelationInspectorViewOuterProps & InspectorPanelMixin2Props & GraphMixin2Props;
type RelationInspectorViewState = RelationInspectorViewOuterState & InspectorPanelMixin2State & GraphMixin2State;

export class RelationInspectorView extends Mixer<RelationInspectorViewProps, RelationInspectorViewState> {

  public static displayName = "RelationInspectorView";

  // listen to graphStore so that the tab for the link will re-render when the link is fully defined
  // (link-relation-view uses @props.graphStore.changeLink() to update the link)
  constructor(props: RelationInspectorViewProps) {
    super(props);
    this.mixins = [new InspectorPanelMixin2(this, props), new GraphMixin2(this, props)];
    const outerState: RelationInspectorViewOuterState = {};
    this.setInitialState(outerState, InspectorPanelMixin2.InitialState);
  }

    public render() {
    if (this.props.node) {
      return this.renderNodeRelationInspector();
    } else {
      return this.renderLinkRelationInspector();
    }
  }

  private renderTabforLink(link) {
    const relationView = <LinkRelationView link={link} graphStore={this.props.graphStore} />;
    const label = link.sourceNode.title;
    const {vector, scalar, accumulator, transferModifier} = RelationFactory.selectionsFromRelation(link.relation);
    const isFullyDefined = (link.relation.isDefined && (vector != null) && (scalar != null)) || (link.relation.customData != null) || (accumulator != null) || (transferModifier != null);

    return TabbedPanelView.Tab({label, component: relationView, defined: isFullyDefined});
  }

  private renderNodeDetailsInspector() {
    let left;
    const inputCount = (left = __guard__(this.props.node.inLinks(), x => x.length)) != null ? left : 0;
    if (!(inputCount > 1)) { return null; }

    const method = this.props.node.combineMethod != null ? this.props.node.combineMethod : "average";
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

  private renderNodeRelationInspector() {
    let selectedTabIndex = 0;
    const tabs = _.map(this.props.node.inLinks(), (link, i) => {
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
    InspectorPanelActions.openInspectorPanel("relations", {link: __guard__(this.props.node.inLinks(), x => x[index])});
  }

  private handleMethodSelected = (evt) => {
    GraphStore.changeNode({ combineMethod: evt.target.value }, this.props.node);
  }
}

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
