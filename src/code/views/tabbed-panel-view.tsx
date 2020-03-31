import * as React from "react";

interface TabInfoSettings {
  label: string;
  component: JSX.Element | null;
  defined?: boolean;
  divider?: boolean;
}

export class TabInfo {
  public readonly label: string;
  public readonly component: JSX.Element | null;
  public readonly defined: boolean;
  public readonly divider: boolean;

  constructor(settings?: TabInfoSettings) {
    settings = settings || {label: "", component: null, defined: false};
    ({label: this.label, component: this.component} = settings);
    this.defined = !!settings.defined;
    this.divider = !!settings.divider;
  }
}

interface TabbedPanelTabViewProps {
  defined: boolean;
  selected: boolean;
  label: string;
  index: number;
  divider: boolean;       // a horizontal line with no associated tab
  onSelected: (index: number) => void;
}

interface TabbedPanelTabViewState {}

class TabbedPanelTabView extends React.Component<TabbedPanelTabViewProps, TabbedPanelTabViewState> {

  public static displayName = "TabbedPanelTabView";

  public render() {
    let classname = this.props.defined ? "tab-link-defined" : "";
    if (this.props.selected) {
      classname += " tab-selected";
    }
    if (this.props.divider) {
      classname += " tab-divider";
    }
    return <li className={classname} onClick={this.handleClicked}>{this.props.label}</li>;
  }

  private handleClicked = (e) => {
    e.preventDefault();
    if (this.props.divider) {
      return;
    }
    return this.props.onSelected(this.props.index);
  }
}

interface TabbedPanelViewProps {
  selectedTabIndex: number;
  onTabSelected: (index: number) => void;
  clientClass?: string;
  onRenderBelowTabsComponent?: () => any; // TODO: get concrete type
  tabs: TabInfo[];
}

export class TabbedPanelView extends React.Component<TabbedPanelViewProps> {

  public static displayName = "TabbedPanelView";

  public static Tab(settings?: TabInfoSettings) {
    return new TabInfo(settings);
  }

  public render() {
    const clientClass = this.props.clientClass ? ` ${this.props.clientClass}` : "";
    return (
      <div className={`tabbed-panel${clientClass}`}>
        <div className={`tabbed-panel-left${clientClass}`}>
          {this.renderTabs(clientClass)}
          {this.props.onRenderBelowTabsComponent ? this.props.onRenderBelowTabsComponent() : undefined}
        </div>
        {this.renderSelectedPanel(clientClass)}
      </div>
    );
  }

  private renderTab(tab, index) {
    return (
      <TabbedPanelTabView
        label={tab.label}
        key={index}
        index={index}
        defined={tab.defined}
        divider={tab.divider}
        selected={index === this.props.selectedTabIndex}
        onSelected={this.props.onTabSelected}
      />
    );
  }

  private renderTabs(clientClass) {
    return (
      <div className={`workspace-tabs${clientClass}`} key="tabs">
        <ul>
          {this.props.tabs.map((tab, index) => this.renderTab(tab, index))}
        </ul>
      </div>
    );
  }

  private renderSelectedPanel(clientClass) {
    return (
      <div className={`workspace-tab-component${clientClass}`}>
        {this.props.tabs.map((tab, index) =>
          <div
            key={index}
            style={{display: index === this.props.selectedTabIndex ? "block" : "none"}}
          >
            {tab.component}
          </div>
        )}
      </div>
    );
  }
}
