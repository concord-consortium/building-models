import { Node } from "../models/node";
import * as React from "react";
import { QuickActionMenu } from "./quick-action-menu";

export type CircleButtonState = "default" | "hover" | "active" | "disabled";

export interface QuickActionButtonProps {
    node: Node;
    graphClickHandler?: () => void;
    showGraphButton?: boolean;
}

export interface QuickActionButtonState {
  state: CircleButtonState;
}


const VerticalEllipse = (props: {size: number} = {size: 16} ) => {
  const {size} = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M6 12a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zm6 2a2 2 0 100-4 2 2 0 000 4z" fill="white" transform="translate(24, 0) rotate(90)" />
    </svg>
  );
};

export class QuickActionButton extends React.Component<QuickActionButtonProps, QuickActionButtonState> {
  constructor(props: QuickActionButtonProps) {
    super(props);
    this.state = { state: "default" };
  }

  public render() {
    const node = this.props.node;
    return(
      <>
        <div
          className="graph-source action-circle"
          data-node-key={node.key}
          onClick={this.handleClick}
        >
          <VerticalEllipse size={16}/>
        </div>
        {this.renderOtherDiv()}
      </>
    );
  }

  private renderOtherDiv() {
    if (this.state.state === "active") {
      const closeActionMenu = () => {
        this.setState({state: "default"});
      };
      return (
        <QuickActionMenu
          node={this.props.node}
          closeFn={closeActionMenu}
          showGraphButton={this.props.showGraphButton}
          graphClickHandler={this.props.graphClickHandler}
        />
      );
    }
    return "";
  }

  private toggleState = (): void => {
    const state = this.state.state;
    console.log("click state", this.state);
    if (state === "default") {
      this.setState({ state: "active" });
    } else if (state === "active") {
      this.setState({ state: "default" });
    }
  }

  private handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    this.toggleState();
  }

}
