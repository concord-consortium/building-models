/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const NodeInspectorView = React.createFactory(require("./node-inspector-view"));
import { LinkInspectorView as LinkInspectorViewClass } from "./link-inspector-view";
const LinkInspectorView = React.createFactory(LinkInspectorViewClass);
import { LinkValueInspectorView as LinkRelationInspectorViewClass } from "./link-value-inspector-view";
const LinkValueInspectorView = React.createFactory(LinkRelationInspectorViewClass);
const NodeValueInspectorView = React.createFactory(require("./node-value-inspector-view"));
const LinkRelationInspectorView = React.createFactory(require("./relation-inspector-view"));
const NodeRelationInspectorView = React.createFactory(require("./relation-inspector-view"));
const SimulationInspectorView   = React.createFactory(require("./simulation-inspector-view"));

const InspectorPanelStore  = require("../stores/inspector-panel-store");

const {div, i, span} = React.DOM;

const ToolButton = React.createFactory(React.createClass({
  displayName: "toolButton",
  render() {
    const { name } = this.props;
    const onClick = () => {
      if (this.props.onClick) { return this.props.onClick(this.props.name); }
    };

    let classes = `icon-codap-${name} tool-button`;
    if (this.props.selected) { classes = `${classes} selected`; }
    if (this.props.disabled) { classes = `${classes} disabled`; }
    return (div({className: classes, onClick}));
  }
})
);

const ToolPanel = React.createFactory(React.createClass({
  displayName: "toolPanel",

  buttonData: [
    {name: "styles", simple: true, shows: "design", "enabled": ["node", "link"] },
    {name: "values", simple: false, shows: "value", "enabled": ["node"] },
    {name: "qualRel", simple: false, shows: "relations", "enabled": ["dependent-node"]},
    {name: "options",  simple: true, shows: "simulation", "enabled": ["nothing"] }
  ],

  isDisabled(button) {
    if (_.includes(button.enabled, "nothing")) { return false; }
    if (_.includes(button.enabled, "node") && this.props.node) { return false; }
    if (_.includes(button.enabled, "dependent-node") && (this.props.node != null ? this.props.node.isDependent() : undefined)) { return false; }
    if (_.includes(button.enabled, "link") && this.props.link) { return false; }
    return true;
  },

  buttonProps(button) {
    const props: any = {
      name:     button.name,
      shows:    button.shows,
      selected: false,
      disabled: this.isDisabled(button)
    };

    if (!this.isDisabled(button)) {
      props.onClick = () => {
        return this.select(button.name);
      };
      props.selected = this.props.nowShowing === button.shows;
    }

    return props;
  },

  select(name) {
    const button = _.find(this.buttonData, {name});
    if (button) {
      if (this.props.nowShowing !== button.shows) {
        return this.props.onNowShowing(button.shows);
      } else {
        return this.props.onNowShowing(null);
      }
    }
  },

  render() {
    let buttons = this.buttonData.slice(0);
    if (this.props.diagramOnly) {
      buttons = _.filter(buttons, button => button.simple);
    }
    const buttonsView = _.map(buttons, (button, i) => {
      const props = this.buttonProps(button);
      props.key = i;
      return (ToolButton(props));
    });

    return (div({className: "tool-panel"}, buttonsView));
  }
})
);

module.exports = React.createClass({

  displayName: "InspectorPanelView",

  mixins: [ InspectorPanelStore.mixin ],

  renderSimulationInspector() {
    return (SimulationInspectorView({}));
  },

  renderDesignInspector() {
    if (this.props.node) {
      return (NodeInspectorView({
        node: this.props.node,
        onNodeChanged: this.props.onNodeChanged,
        onNodeDelete: this.props.onNodeDelete,
        palette: this.props.palette
      }));
    } else if (this.props.link) {
      return (LinkInspectorView({link: this.props.link,  graphStore: this.props.graphStore}));
    }
  },

  renderValueInspector() {
    if (this.props.node) {
      return (NodeValueInspectorView({node: this.props.node, graphStore: this.props.graphStore}));
    } else if (this.props.link) {
      return (LinkValueInspectorView({link: this.props.link}));
    }
  },

  renderRelationInspector() {
    if (this.props.node != null ? this.props.node.isDependent() : undefined) {
      return (NodeRelationInspectorView({node: this.props.node, graphStore: this.props.graphStore}));
    } else if (this.props.link) {
      return (LinkRelationInspectorView({link: this.props.link, graphStore: this.props.graphStore}));
    } else {
      return null;
    }
  },

  // 2015-12-09 NP: Deselection makes inpector panel hide http://bit.ly/1ORBBp2
  // 2016-03-15 SF: Changed this to a function explicitly called when selection changes
  nodeSelectionChanged() {
    if (!this.props.node && !this.props.link) {
      return InspectorPanelStore.actions.closeInspectorPanel();
    }
  },

  renderInspectorPanel() {
    const view = (() => { switch (this.state.nowShowing) {
    case "simulation": return this.renderSimulationInspector();
    case "design":     return this.renderDesignInspector();
    case "value":      return this.renderValueInspector();
    case "relations":  return this.renderRelationInspector();
    } })();

    return (div({className: "inspector-panel-content"},
      view
    ));
  },

  render() {
    let className = "inspector-panel";
    if (this.props.display !== undefined) {
      if (this.props.display === true) {
        className = "inspector-panel";
      } else {
        className = "inspector-panel hidden";
      }
    }
    if (!this.state.nowShowing) {
      className = `${className} collapsed`;
    }

    return (div({className},
      (ToolPanel({
        node: this.props.node,
        link: this.props.link,
        nowShowing: this.state.nowShowing,
        onNowShowing: InspectorPanelStore.actions.openInspectorPanel,
        diagramOnly: this.props.diagramOnly
      })),
      this.renderInspectorPanel()
    ));
  }
});
