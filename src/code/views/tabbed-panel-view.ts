/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const {div, ul, li, a} = React.DOM;

class TabInfo {
  private label: string;
  private component: any;
  private defined: boolean;

  constructor(settings) {
    if (settings == null) { settings = {}; }
    ({label: this.label, component: this.component, defined: this.defined} = settings);
  }
}

const Tab = React.createFactory(React.createClass({

  displayName: "TabbedPanelTab",

  clicked(e) {
    e.preventDefault();
    return this.props.onSelected(this.props.index);
  },

  render() {
    let classname = this.props.defined ? "tab-link-defined" : "";
    if (this.props.selected) { classname += " tab-selected"; }
    return (li({className: classname, onClick: this.clicked}, this.props.label));
  }
})
);

module.exports = React.createClass({

  displayName: "TabbedPanelView",

  getInitialState() {
    return {selectedTabIndex: this.props.selectedTabIndex || 0};
  },

  componentWillReceiveProps(nextProps) {
    if (this.state.selectedTabIndex !== nextProps.selectedTabIndex) {
      return this.selectedTab(nextProps.selectedTabIndex);
    }
  },

  statics: {
    Tab(settings) { return new TabInfo(settings); }
  },

  selectedTab(index) {
    return this.setState({selectedTabIndex: index || 0});
  },

  onTabSelected(index) {
    if (this.props.onTabSelected) {
      return this.props.onTabSelected(index);
    } else {
      return this.selectedTab(index);
    }
  },

  renderTab(tab, index) {
    return (Tab({
      label: tab.label,
      key: index,
      index,
      defined: tab.defined,
      selected: (index === this.state.selectedTabIndex),
      onSelected: this.onTabSelected
    }));
  },

  renderTabs(clientClass) {
    return (div({className: `workspace-tabs${clientClass}`, key: "tabs"},
      (ul({}, this.props.tabs.map((tab, index) => this.renderTab(tab,index))))
    ));
  },


  renderSelectedPanel(clientClass) {
    return (div({className: `workspace-tab-component${clientClass}`},
      this.props.tabs.map((tab, index) =>
        (div({
          key: index,
          style: {
            display: index === this.state.selectedTabIndex ? "block" : "none"
          }
        },
        tab.component
        )))
    ));
  },

  render() {
    const clientClass = this.props.clientClass ? ` ${this.props.clientClass}` : "";
    return (div({className: `tabbed-panel${clientClass}`},
      (div({className: `tabbed-panel-left${clientClass}`}, [
        this.renderTabs(clientClass),
        (this.props.onRenderBelowTabsComponent != null) ? this.props.onRenderBelowTabsComponent() : undefined
      ])),
      this.renderSelectedPanel(clientClass)
    ));
  }
});
