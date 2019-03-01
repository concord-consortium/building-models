import * as React from "react";

import { tr } from "../utils/translate";

interface OpenInCodapViewProps {
  disabled: boolean;
}

interface OpenInCodapViewState {}

export class OpenInCodapView extends React.Component<OpenInCodapViewProps, OpenInCodapViewState> {

  public static displayName = "OpenInCodapView";

  public render() {
    const {disabled} = this.props;

    return (
      <span className="link">
        <a
          href={this.link()}
          className={disabled ? "disabled" : undefined}
          onClick={disabled ? this.handleDisabledLink : undefined}
        >
          {tr("~OPEN_IN_CODAP.TITLE")}
        </a>
      </span>
    );
  }

  private link() {
    const encodedUrl = encodeURIComponent(window.location.toString());
    return `http://codap.concord.org/releases/latest/static/dg/en/cert/index.html?documentServer=http://document-store.herokuapp.com/&di=${encodedUrl}`;
  }

  private handleDisabledLink = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    alert(tr("~OPEN_IN_CODAP.DISABLED"));
  }
}
