import * as React from "react";

interface TabInfoSettings {
  label: string;
  component: JSX.Element | null;
  defined?: boolean;
}

export class TabInfo {
  public readonly label: string;
  public readonly component: JSX.Element | null;
  public readonly defined: boolean;

  constructor(settings?: TabInfoSettings) {
    settings = settings || {label: "", component: null, defined: false};
    ({label: this.label, component: this.component} = settings);
    this.defined = !!settings.defined;
  }
}

interface TabbedPanelTabViewProps {
  defined: boolean;
  selected: boolean;
  label: string;
  index: number;
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
    return <li className={classname} onClick={this.handleClicked}>{this.props.label}</li>;
  }

  private handleClicked = (e) => {
    e.preventDefault();
    return this.props.onSelected(this.props.index);
  }
}

interface TabbedPanelViewProps {
  selectedTabIndex?: number;
  onTabSelected?: (index: number) => void;
  clientClass?: string;
  onRenderBelowTabsComponent?: () => any; // TODO: get concrete type
  tabs: TabInfo[];
}

interface TabbedPanelViewState {
  selectedTabIndex: number;
}

export class TabbedPanelView extends React.Component<TabbedPanelViewProps, TabbedPanelViewState> {

  public static displayName = "TabbedPanelView";

  public static Tab(settings?: TabInfoSettings) {
    return new TabInfo(settings);
  }

  constructor(props: TabbedPanelViewProps) {
    super(props);
    this.state = {selectedTabIndex: this.props.selectedTabIndex || 0};
  }

  public componentWillReceiveProps(nextProps) {
    if (this.state.selectedTabIndex !== nextProps.selectedTabIndex) {
      return this.selectedTab(nextProps.selectedTabIndex);
    }
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

  private selectedTab(index) {
    return this.setState({selectedTabIndex: index || 0});
  }

  private handleTabSelected = (index) => {
    if (this.props.onTabSelected) {
      return this.props.onTabSelected(index);
    } else {
      return this.selectedTab(index);
    }
  }

  private renderTab(tab, index) {
    return (
      <TabbedPanelTabView
        label={tab.label}
        key={index}
        index={index}
        defined={tab.defined}
        selected={index === this.state.selectedTabIndex}
        onSelected={this.handleTabSelected}
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
            style={{display: index === this.state.selectedTabIndex ? "block" : "none"}}
          >
            {tab.component}
          </div>
        )}
      </div>
    );
  }
}
