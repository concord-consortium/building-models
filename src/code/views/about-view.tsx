import * as React from "react";
import * as $ from "jquery";

interface AboutViewProps {}

interface AboutViewState {
  showing: boolean;
  year: string;
}

export class AboutView extends React.Component<AboutViewProps, AboutViewState> {

  public static displayName = "AboutView";

  public state: AboutViewState = {
    showing: false,
    year: ""
  };

  public componentWillMount() {
    const build_info = $("html").find("meta[name='build-info']").attr("content") || "";
    const year = build_info.split(" ")[0].split("-")[0];
    this.setState({showing: false, year});
  }

  public render() {
    return (
      <div>
        <div className="misc-actions">
          <i className="icon-codap-help" onClick={this.handleOpen} />
        </div>
        {this.state.showing ? this.renderShowing() : null}
      </div>
    );
  }

  private handleClose = () => {
    this.setState({showing: false});
  }

  private handleOpen = () => {
    this.setState({showing: true});
  }

  private handleIgnore = (e) => {
    e.stopPropagation();
  }

  private renderShowing() {
    return (
      <div className="BuildInfoView" onClick={this.handleClose}>
        <div className="content" onClick={this.handleIgnore}>
          <div className="top" style={{textAlign: "right"}}>
            <i className="icon-codap-ex" style={{padding: 0, cursor: "pointer"}} onClick={this.handleClose} />
          </div>
          <div className="inner" style={{paddingTop: 0, textAlign: "center"}}>
            <h2>SageModeler</h2>
            <p>
              {`Copyright © ${this.state.year} The Concord Consortium. All rights reserved.`}
            </p>
            <p>
              This open-source software is licensed under the <a href="https://github.com/concord-consortium/building-models/blob/master/LICENSE" target="_blank">MIT license</a>.
            </p>
            <p>
              Please provide attribution to The Concord Consortium
              <br />
              and the URL <a href="https://concord.org/" target="_blank">https://concord.org</a>.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
