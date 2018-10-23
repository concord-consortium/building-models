/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const LinkRelationView = require("./link-relation-view");
const RelationFactory = require("../models/relation-factory");
import { TabbedPanelView } from "./tabbed-panel-view";
const tr = require("../utils/translate");

const inspectorPanelStore = require("../stores/inspector-panel-store");
const graphStore = require("../stores/graph-store");

module.exports = React.createClass({

  displayName: "RelationInspectorView",

  // listen to graphStore so that the tab for the link will re-render when the link is fully defined
  // (link-relation-view uses @props.graphStore.changeLink() to update the link)
  mixins: [ inspectorPanelStore.mixin, graphStore.mixin ],

  renderTabforLink(link) {
    const relationView = (LinkRelationView({link, graphStore: this.props.graphStore}));
    const label = link.sourceNode.title;
    const {vector, scalar, accumulator, transferModifier} = RelationFactory.selectionsFromRelation(link.relation);
    const isFullyDefined = (link.relation.isDefined && (vector != null) && (scalar != null)) || (link.relation.customData != null) || (accumulator != null) || (transferModifier != null);

    return TabbedPanelView.Tab({label, component: relationView, defined: isFullyDefined});
  },

  onTabSelected(index) {
    inspectorPanelStore.actions.openInspectorPanel("relations", {link: __guard__(this.props.node.inLinks(), x => x[index])});
  },

  onMethodSelected(evt) {
    graphStore.store.changeNode({ combineMethod: evt.target.value }, this.props.node);
  },

  renderNodeDetailsInspector() {
    let left;
    const inputCount = (left = __guard__(this.props.node.inLinks(), x => x.length)) != null ? left : 0;
    if (!(inputCount > 1)) { return null; }

    const method = this.props.node.combineMethod != null ? this.props.node.combineMethod : "average";
    return (
      <div className="node-details-inspector" key="details">
        {tr("~NODE-RELATION-EDIT.COMBINATION_METHOD")}
        <select key={0} value={method} onChange={this.onMethodSelected}>
          <option value="average" key={1}>{tr("~NODE-RELATION-EDIT.ARITHMETIC_MEAN")}</option>
          <option value="product" key={2}>{tr("~NODE-RELATION-EDIT.SCALED_PRODUCT")}</option>
        </select>
      </div>
    );
  },

  renderNodeRelationInspector() {
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
          onTabSelected={this.onTabSelected}
          onRenderBelowTabsComponent={this.renderNodeDetailsInspector}
        />
      </div>
    );
  },

  renderLinkRelationInspector() {
    return <div className="relation-inspector" />;
  },

  render() {
    if (this.props.node) {
      return this.renderNodeRelationInspector();
    } else {
      return this.renderLinkRelationInspector();
    }
  }
});

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
