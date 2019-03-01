import * as React from "react";

interface LinkValueInspectorViewProps {}
interface LinkValueInspectorViewState {}

export class LinkValueInspectorView extends React.Component<LinkValueInspectorViewProps, LinkValueInspectorViewState> {

  public static displayName = "LinkValueInspectorView";

  public render() {
    return <div className="link-inspector-view" />;
  }
}
