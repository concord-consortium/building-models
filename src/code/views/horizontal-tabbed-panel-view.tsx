import * as React from "react";

interface HorizontalTabInfoSettings {
  label: string;
  component: JSX.Element | null;
  disabled?: boolean;
}

export class HorizontalTabInfo {
  public readonly label: string;
  public readonly component: JSX.Element | null;
  public readonly disabled: boolean;

  constructor(settings?: HorizontalTabInfoSettings) {
    settings = settings || {label: "", component: null, disabled: false};
    ({label: this.label, component: this.component} = settings);
    this.disabled = !!settings.disabled;
  }
}

interface HorizontalTabbedPanelTabViewProps {
  selected: boolean;
  disabled?: boolean;
  label: string;
  index: number;
  onSelected: (index: number) => void;
}

interface HorizontalTabbedPanelTabViewState {}

class HorizontalTabbedPanelTabView extends React.Component<HorizontalTabbedPanelTabViewProps, HorizontalTabbedPanelTabViewState> {

  public static displayName = "HorizontalTabbedPanelTabView";

  public render() {
    const classname = this.props.disabled ? "horizontal-tab-disabled" : (this.props.selected ? "horizontal-tab-selected" : "");
    return <li className={classname} onClick={this.handleClicked}>{this.props.label}</li>;
  }

  private handleClicked = (e) => {
    e.preventDefault();
    if (!this.props.disabled) {
      this.props.onSelected(this.props.index);
    }
  }
}

interface HorizontalTabbedPanelViewProps {
  selectedTabIndex: number;
  onTabSelected: (index: number) => void;
  clientClass?: string;
  tabs: HorizontalTabInfo[];
}

export class HorizontalTabbedPanelView extends React.Component<HorizontalTabbedPanelViewProps> {

  public static displayName = "TabbedPanelView";

  public static Tab(settings?: HorizontalTabInfoSettings) {
    return new HorizontalTabInfo(settings);
  }

  public render() {
    const clientClass = this.props.clientClass ? ` ${this.props.clientClass}` : "";
    return (
      <div className={`horizontal-tabbed-panel${clientClass}`}>
        <div className={`horizontal-tabbed-panel-left${clientClass}`}>
          {this.renderTabs(clientClass)}
        </div>
        {this.renderSelectedPanel(clientClass)}
      </div>
    );
  }

  private renderTab(tab, index) {
    return (
      <HorizontalTabbedPanelTabView
        label={tab.label}
        key={index}
        index={index}
        selected={index === this.props.selectedTabIndex}
        onSelected={this.props.onTabSelected}
        disabled={tab.disabled}
      />
    );
  }

  private renderTabs(clientClass) {
    return (
      <div className={`workspace-horizontal-tabs${clientClass}`} key="horizontal-tabs">
        <ul>
          {this.props.tabs.map((tab, index) => this.renderTab(tab, index))}
        </ul>
      </div>
    );
  }

  private renderSelectedPanel(clientClass) {
    return (
      <div className={`workspace-horizontal-tab-component${clientClass}`}>
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
