import * as React from "react";

import { tr } from "../utils/translate";
import { licenses } from "../data/licenses";
import { ImageMetadata } from "./preview-image-dialog-view";

interface ImageMetadataViewProps {
  metadata: ImageMetadata;
  small?: boolean;
  update: ({metadata: ImageMetadata}) => void;
}

interface ImageMetadataViewState {
  hostname: string | null;
}

export class ImageMetadataView extends React.Component<ImageMetadataViewProps, ImageMetadataViewState> {

  public static displayName = "ImageMetadata";

  public state: ImageMetadataViewState = {hostname: null};

  private title: HTMLInputElement | null;
  private link: HTMLInputElement | null;
  private license: HTMLSelectElement | null;

  public render() {
    return (
      <div className={`image-metadata${this.props.small ? " small" : ""}`}>
        {this.props.metadata ?
          this.props.small ?
            this.renderSmallMetadata() :
            this.renderMetadata() :
          undefined}
      </div>
    );
  }

  private renderMetadata() {
    const licenseName = this.props.metadata.license || "public domain";
    const licenseData = licenses.getLicense(licenseName);
    const { title }   = this.props.metadata;
    const { link }    = this.props.metadata;

    if (this.props.metadata.source === "external") {
      return (
        <div key="external">
          <table>
            <tbody>
              <tr>
                <td>{tr("~METADATA.TITLE")}</td>
                <td>
                  <input ref={(el) => this.title = el} value={title} onChange={this.handleChanged} />
                </td>
              </tr>

              <tr>
                <td>{tr("~METADATA.LINK")}</td>
                <td>
                  <input ref={(el) => this.link = el} value={link} onChange={this.handleChanged} />
                </td>
              </tr>

              <tr>
                <td>{tr("~METADATA.CREDIT")}</td>
                <td>
                  <select ref={(el) => this.license = el} value={licenseName} onChange={this.handleChanged}>
                    {licenses.getRenderOptions(licenseName)}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="learn-more">
            <a href={licenseData.link} target="_blank">{`Learn more about ${licenseData.fullLabel}`}</a>
          </p>
        </div>
      );
    } else {
      return (
        <div key="internal">
          <p />
          <div>{title}</div>
          {link ? <div key="hostname"><a href={link} target="_blank">{tr("~METADATA.SEE_IT_ON", {hostname: this.hostname()})}</a></div> : undefined}
          <p />
          <div>{tr("~METADATA.LICENSE")}</div>
          <div key="license">
            <a href={licenseData.link} target="_blank">{licenseData.label}</a>
          </div>
        </div>
      );
    }
  }

  private renderSmallMetadata() {
    const licenseName = this.props.metadata.license || "public domain";
    const licenseData = licenses.getLicense(licenseName);
    const { title }   = this.props.metadata;
    return (
      <div>
        <div>{title}</div>
        <div className="license">{tr("~METADATA.LICENSE")}: <a href={licenseData.link} target="_blank">{licenseData.label}</a></div>
      </div>
    );
  }

  private hostname() {
    // instead of using a regexp to extract the hostname use the dom
    const link = document.createElement("a");
    link.setAttribute("href", this.props.metadata.link);
    return link.hostname;
  }

  private handleChanged = () => {
    const newMetaData = {
      title: this.title && this.title.value,
      link: this.link && this.link.value,
      license: this.license && this.license.value,
      source: "external"
    };

    this.props.update({metadata: newMetaData});
  }
}
