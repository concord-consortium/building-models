import * as React from "react";

const xlat       = require("../utils/translate");
const licenses   = require("../data/licenses");
const ImageDialogStore = require("../stores/image-dialog-store");

interface ImageMetadataViewProps {
  metadata: any; // TODO: get concrete type
  update: (data: any) => void; // TODO: get concrete type
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
      <div className="image-metadata">
        {this.props.metadata ? this.renderMetadata() : undefined}
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
                <td>{xlat("~METADATA.TITLE")}</td>
                <td>
                  <input ref={(el) => this.title = el} value={title} onChange={this.handleChanged} />
                </td>
              </tr>

              <tr>
                <td>{xlat("~METADATA.LINK")}</td>
                <td>
                  <input ref={(el) => this.link = el} value={link} onChange={this.handleChanged} />
                </td>
              </tr>

              <tr>
                <td>{xlat("~METADATA.CREDIT")}</td>
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
          <div>{`\"${title}\"`}</div>
          {link ? <div key="hostname"><a href={link} target="_blank">{`See it on ${this.hostname()}`}</a></div> : undefined}
          <p />
          <div>License</div>
          <div key="license">
            <a href={licenseData.link} target="_blank">{licenseData.label}</a>
          </div>
        </div>
      );
    }
  }

  private hostname() {
    // instead of using a regexp to extract the hostname use the dom
    const link = document.createElement("a");
    link.setAttribute("href", this.props.metadata != null ? this.props.metadata.link : undefined);
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
