import * as React from "react";

import { ModalDialogView } from "./modal-dialog-view";
import { TabbedPanelView, TabInfo } from "./tabbed-panel-view";

interface ModalTabbedDialogViewProps {
  title: string;
  selectedTabIndex: number;
  onTabSelected: (index: number) => void;
  close: () => void;
  clientClass: string;
  tabs: TabInfo[];
}

interface ModalTabbedDialogViewState {}

export class ModalTabbedDialogView extends React.Component<ModalTabbedDialogViewProps, ModalTabbedDialogViewState> {

  public static displayName = "ModalTabbedDialogView";

  public render() {
    return (
      <ModalDialogView title={this.props.title} close={this.props.close}>
        <TabbedPanelView {...this.props} />
      </ModalDialogView>
    );
  }
}
