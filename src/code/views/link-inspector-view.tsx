import * as React from "react";

import { tr } from "../utils/translate";

const palettes = [
  ["#4D6A6D", "#798478", "#A0A083", "#C9ADA1", "#EAE0CC"],
  ["#351431", "#775253", "#BDC696", "#D1D3C4", "#DFE0DC"],
  ["#D6F49D", "#EAD637", "#CBA328", "#230C0F", "#A2D3C2"]
];
const palette = palettes[2];

interface LinkInspectorViewProps {
  link: any; // TODO: get concrete type
  graphStore: any; // TODO: get concrete type
}

interface LinkInspectorViewState {}

export class LinkInspectorView extends React.Component<LinkInspectorViewProps, LinkInspectorViewState> {

  public static displayName = "LinkInspectorView";

  public render() {
    return (
      <div className="link-inspector-view">
        <div className="inspector-content">
          {!this.props.link.transferNode ?
            <div className="edit-row">
              <label htmlFor="title">{tr("~LINK-EDIT.TITLE")}</label>
              <input type="text" name="title" value={this.props.link.title} onChange={this.handleChangeTitle} />
            </div> : undefined}
          <div className="edit-row">
            <label className="link-delete" onClick={this.handleDeleteLink}>{tr("~LINK-EDIT.DELETE")}</label>
          </div>
        </div>
      </div>
    );
  }

  private handleChangeTitle = (e) => {
    this.props.graphStore.changeLink(this.props.link, {title: e.target.value});
  }

  private handleDeleteLink = () => {
    this.props.graphStore.changeLink(this.props.link, {deleted: true});
  }
}
