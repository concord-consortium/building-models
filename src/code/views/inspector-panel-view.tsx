const _ = require("lodash");
import * as React from "react";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { NodeInspectorView } from "./node-inspector-view";
import { LinkInspectorView } from "./link-inspector-view";
import { LinkValueInspectorView } from "./link-value-inspector-view";
import { NodeValueInspectorView } from "./node-value-inspector-view";
import { RelationInspectorView } from "./relation-inspector-view";
import { SimulationInspectorView } from "./simulation-inspector-view";

import { InspectorPanelActions, InspectorPanelMixin, InspectorPanelMixin2Props, InspectorPanelMixin2State, InspectorPanelMixin2 } from "../stores/inspector-panel-store";
import { Mixer } from "../mixins/components";

interface ToolButtonViewProps {
  name: string;
  selected: boolean;
  disabled: boolean;
  onClick: (name: string) => void;
}

class ToolButtonView extends React.Component<ToolButtonViewProps, {}> {

  public static displayName = "ToolButtonView";

  public render() {
    const { name } = this.props;
    let classes = `icon-codap-${name} tool-button`;
    if (this.props.selected) { classes = `${classes} selected`; }
    if (this.props.disabled) { classes = `${classes} disabled`; }
    return <div className={classes} onClick={this.handleClick} />;
  }

  private handleClick = () => {
    if (this.props.onClick) {
      this.props.onClick(this.props.name);
    }
  }
}

interface ToolPanelButton {
  name: string;
  simple: boolean;
  shows: string;
  enabled: string[];
}

interface ToolPanelViewProps {
  diagramOnly: boolean;
  node: any; // TODO: get concrete type
  link: any; // TODO: get concrete type
  nowShowing: string;
  onNowShowing: (shows: string|null) => void;
}

class ToolPanelView extends React.Component<ToolPanelViewProps, {}> {

  public static displayName: "ToolPanelView";

  private buttonData: ToolPanelButton[] = [
    {name: "styles", simple: true, shows: "design", "enabled": ["node", "link"] },
    {name: "values", simple: false, shows: "value", "enabled": ["node"] },
    {name: "qualRel", simple: false, shows: "relations", "enabled": ["dependent-node"]},
    {name: "options",  simple: true, shows: "simulation", "enabled": ["nothing"] }
  ];

  public render() {
    let buttons = this.buttonData.slice(0);
    if (this.props.diagramOnly) {
      buttons = _.filter(buttons, button => button.simple);
    }
    const buttonsView = _.map(buttons, (button, i) => {
      const props = this.buttonProps(button);
      props.key = i;
      return <ToolButtonView {...props} />;
    });

    return <div className="tool-panel">{buttonsView}</div>;
  }

  private isDisabled(button: ToolPanelButton) {
    if (_.includes(button.enabled, "nothing")) { return false; }
    if (_.includes(button.enabled, "node") && this.props.node) { return false; }
    if (_.includes(button.enabled, "dependent-node") && (this.props.node != null ? this.props.node.isDependent() : undefined)) { return false; }
    if (_.includes(button.enabled, "link") && this.props.link) { return false; }
    return true;
  }

  private buttonProps(button: ToolPanelButton) {
    const props: any = {
      name:     button.name,
      shows:    button.shows,
      selected: false,
      disabled: this.isDisabled(button)
    };

    if (!this.isDisabled(button)) {
      props.onClick = () => {
        this.select(button.name);
      };
      props.selected = this.props.nowShowing === button.shows;
    }

    return props;
  }

  private select(name) {
    const button = _.find(this.buttonData, {name});
    if (button) {
      if (this.props.nowShowing !== button.shows) {
        this.props.onNowShowing(button.shows);
      } else {
        this.props.onNowShowing(null);
      }
    }
  }
}

interface InspectorPanelViewOuterProps {
  display?: boolean;
  diagramOnly: boolean;
  node: any; // TODO: get concrete type
  link: any; // TODO: get concrete type
  onNodeChanged: (node: any, data: any) => void; // TODO: get concrete type
  onNodeDelete: (node: any) => void; // TODO: get concrete type
  palette: any; // TODO: get concrete type
  graphStore: any; // TODO: get concrete type
}
interface InspectorPanelViewOuterState {
}

type InspectorPanelViewProps = InspectorPanelViewOuterProps & InspectorPanelMixin2Props;
type InspectorPanelViewState = InspectorPanelViewOuterState & InspectorPanelMixin2State;

export class InspectorPanelView extends Mixer<InspectorPanelViewProps, InspectorPanelViewState> {

  public static displayName = "InspectorPanelView";

  constructor(props: InspectorPanelViewProps) {
    super(props);
    this.mixins = [new InspectorPanelMixin2(this, props)];
    const outerState: InspectorPanelViewOuterState = {};
    this.setInitialState(outerState, InspectorPanelMixin2.InitialState);
  }

  public render() {
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

    return (
      <div className={className}>
        <ToolPanelView
          node={this.props.node}
          link={this.props.link}
          nowShowing={this.state.nowShowing}
          onNowShowing={InspectorPanelActions.openInspectorPanel}
          diagramOnly={this.props.diagramOnly}
        />
        {this.renderInspectorPanel()}
      </div>
    );
  }

  public renderSimulationInspector() {
    return <SimulationInspectorView />;
  }

  public renderDesignInspector() {
    if (this.props.node) {
      return (
        <NodeInspectorView
          title={this.props.node.title}
          node={this.props.node}
          onNodeChanged={this.props.onNodeChanged}
          onNodeDelete={this.props.onNodeDelete}
          // palette={this.props.palette}
        />
      );
    } else if (this.props.link) {
      return <LinkInspectorView link={this.props.link} graphStore={this.props.graphStore} />;
    }
  }

  public renderValueInspector() {
    if (this.props.node) {
      return <NodeValueInspectorView node={this.props.node} graphStore={this.props.graphStore} />;
    } else if (this.props.link) {
      return <LinkValueInspectorView />; // WAS: <LinkValueInspectorView link={this.props.link} />; but link is not a prop
    }
  }

  public renderRelationInspector() {
    if (this.props.node != null ? this.props.node.isDependent() : undefined) {
      return <RelationInspectorView node={this.props.node} graphStore={this.props.graphStore} />;
    } else if (this.props.link) {
      return <RelationInspectorView link={this.props.link} graphStore={this.props.graphStore} />;
    } else {
      return undefined;
    }
  }

  // 2015-12-09 NP: Deselection makes inpector panel hide http://bit.ly/1ORBBp2
  // 2016-03-15 SF: Changed this to a function explicitly called when selection changes
  private nodeSelectionChanged() {
    if (!this.props.node && !this.props.link) {
      return InspectorPanelActions.closeInspectorPanel();
    }
  }

  private renderInspectorPanel() {
    let view: JSX.Element | undefined;
    switch (this.state.nowShowing) {
      case "simulation":
        view = this.renderSimulationInspector();
        break;
      case "design":
        view = this.renderDesignInspector();
        break;
      case "value":
        view = this.renderValueInspector();
        break;
      case "relations":
        view = this.renderRelationInspector();
        break;
    }
    return <div className="inspector-panel-content">{view}</div>;
  }

}

