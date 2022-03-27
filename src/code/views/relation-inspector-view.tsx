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
import { GraphStore, GraphMixin, GraphMixinProps, GraphMixinState, GraphStoreClass } from "../stores/graph-store";
import { Mixer } from "../mixins/components";
import { Link } from "../models/link";
import { Node } from "../models/node";
import { HorizontalTabbedPanelView } from "./horizontal-tabbed-panel-view";

interface RelationInspectorViewOuterProps {
  node?: Node | null;
  link?: Link | null;
  graphStore: GraphStoreClass;
}
interface RelationInspectorViewOuterState {
  selectedHoriztonalTabIndex: number;
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
    const outerState: RelationInspectorViewOuterState = {
      selectedHoriztonalTabIndex: 0,
    };
    this.setInitialState(outerState, InspectorPanelMixin.InitialState());
  }

  public render() {
    const {node, link} = this.props;
    if (node) {
      return this.renderNodeRelationInspector(node);
    } else if (link) {
      return this.renderLinkRelationInspector(link);
    } else {
      return <div />;
    }
  }

  private renderTabforLink(link, node) {
    const relationView = <LinkRelationView link={link} graphStore={this.props.graphStore} />;
    const label = node.title;
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
    let selectedAffectsTabIndex = 0;
    let selectedAffectedByTabIndex = 0;

    const affectedByLinkTabs = _.map(node.inLinks(), (link, i) => {
      if (this.state.selectedLink === link) { selectedAffectedByTabIndex = i; }
      return this.renderTabforLink(link, link.sourceNode);
    });
    const affectedByTabDisabled = affectedByLinkTabs.length === 0;

    const affectsLinkTabs = _.map(node.outLinks(), (link, i) => {
      if (this.state.selectedLink === link) { selectedAffectsTabIndex = i; }
      return this.renderTabforLink(link, link.targetNode);
    });
    const affectsTabDisabled = affectsLinkTabs.length === 0;

    // don't render a totally disabled tabbed panel
    if (affectedByTabDisabled && affectsTabDisabled) {
      return <div />;
    }

    const affectedByTab = HorizontalTabbedPanelView.Tab({
      label: "Affected By",
      component: <TabbedPanelView
        tabs={affectedByLinkTabs}
        selectedTabIndex={selectedAffectedByTabIndex}
        onTabSelected={this.handleAffectedByLinkTabSelected}
        onRenderBelowTabsComponent={this.renderNodeDetailsInspector}
      />,
      disabled: affectedByTabDisabled
    });

    const affectsTab = HorizontalTabbedPanelView.Tab({
      label: "Affects",
      component: <TabbedPanelView
        tabs={affectsLinkTabs}
        selectedTabIndex={selectedAffectsTabIndex}
        onTabSelected={this.handleAffectsLinkTabSelected}
      />,
      disabled: affectsTabDisabled
    });

    // make sure the selected tab isn't disabled
    let selectedTabIndex = this.state.selectedHoriztonalTabIndex;
    if ((selectedTabIndex === 0) && affectedByTabDisabled) {
      selectedTabIndex = 1;
    } else if ((selectedTabIndex === 1) && affectsTabDisabled) {
      selectedTabIndex = 0;
    }

    return (
      <div className="relation-inspector">
        <HorizontalTabbedPanelView
          selectedTabIndex={selectedTabIndex}
          onTabSelected={this.handleHorizontalTabSelected}
          tabs={[affectedByTab, affectsTab]}
        />
      </div>
    );
  }

  private renderLinkRelationInspector(link: Link) {
    return (
      <div className="relation-inspector" >
        <TabbedPanelView
          tabs={[this.renderTabforLink(link, link.sourceNode)]}
          selectedTabIndex={0}
          onTabSelected={this.ignoreTabSelected}
        />
      </div>
    );
  }

  private handleHorizontalTabSelected = (index) => {
    this.setState({selectedHoriztonalTabIndex: index});
  }

  private handleAffectedByLinkTabSelected = (index) => {
    const {node} = this.props;
    if (node) {
      InspectorPanelActions.openInspectorPanel("relations", {link: __guard__(node.inLinks(), x => x[index])});
    }
  }

  private handleAffectsLinkTabSelected = (index) => {
    const {node} = this.props;
    if (node) {
      InspectorPanelActions.openInspectorPanel("relations", {link: __guard__(node.outLinks(), x => x[index])});
    }
  }

  private ignoreTabSelected = () => undefined;

  private handleMethodSelected = (evt) => {
    const {node} = this.props;
    if (node) {
      GraphStore.changeNode({ combineMethod: evt.target.value }, node);
    }
  }
}

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
