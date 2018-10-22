import * as React from "react";

import { ModalDialogView } from "./modal-dialog-view";
import { TabbedPanelView } from "./tabbed-panel-view";

interface ModalTabbedDialogViewProps {
  title: string;
  close: () => void;
  clientClass: any; // TODO: get concrete type
  tabs: any; // TODO: get concrete type
}

export class ModalTabbedDialogView extends React.Component<ModalTabbedDialogViewProps, {}> {

  public static displayName = "ModalTabbedDialogView";

  public render() {
    return (
      <ModalDialogView title={this.props.title} close={this.props.close}>
        <TabbedPanelView clientClass={this.props.clientClass} tabs={this.props.tabs} />
      </ModalDialogView>
    );
  }
}
