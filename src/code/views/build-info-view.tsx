import * as React from "react";

const Migration = require("../data/migrations/migrations");

interface BuildInfoViewState {
  date: string;
  showing: boolean;
  commit: string;
  tag: string;
  commiter: string;
  dataVersion: string;
}

export class BuildInfoView extends React.Component<{}, BuildInfoViewState> {

  public static displayName = "BuildInfoView";

  public componentWillMount() {
    const build_info = $("html").find("meta[name='build-info']").attr("content");
    const [date, tag, commit, commiter] = build_info.split(" ");
    return this.setState({
      date,
      showing: false,
      commit,
      tag,
      commiter,
      dataVersion: Migration.latestVersion()
    });
  }

  public render() {
    return (
      <div className="build-info-bottom-bar">
        <div className="build-info-button" onClick={this.handleOpen}>built on {this.state.date}</div>
        {this.state.showing ? this.renderShowing() : null}
      </div>
    );
  }

  private link() {
    return `https://github.com/concord-consortium/building-models/commit/${this.state.commit}`;
  }

  private handleClose = () => {
    this.setState({showing: false});
  }

  private handleOpen = () => {
    this.setState({showing: true});
  }

  private handleIgnore = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }

  private renderShowing() {
    return (
      <div className="BuildInfoView" onClick={this.handleClose}>
        <div className="content" onClick={this.handleIgnore}>
          <div className="top" style={{textAlign: "right"}}>
            <i className="icon-codap-ex" style={{padding: 0, cursor: "pointer"}} onClick={this.handleClose} />
          </div>
          <table>
            <tbody>
              <tr className="date">
                <td className="key">released on:</td>
                <td className="value">{this.state.date}</td>
              </tr>
              <tr className="commit">
                <td className="key">commit:</td>
                <td className="value">
                  <a href={this.link()} target="_blank">{this.state.commit}</a>
                </td>
              </tr>
              <tr className="tag">
                <td className="key">tag:</td>
                <td className="value">{this.state.tag}</td>
              </tr>
              <tr className="commit">
                <td className="key">commiter:</td>
                <td className="value">{this.state.commiter}</td>
              </tr>
              <tr className="buildInfo">
                <td className="key">data format version:</td>
                <td className="value">{this.state.dataVersion}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

