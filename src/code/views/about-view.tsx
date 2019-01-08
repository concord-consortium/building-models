import * as React from "react";
import * as $ from "jquery";
import { DropDownView } from "./dropdown-view";

interface AboutViewProps {
  standaloneMode: boolean;
}

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
    return this.props.standaloneMode ? this.renderStandalone() : this.renderNormal();
  }

  private renderNormal() {
    const options = [{
      name: "about",
      action: () => this.showAbout()
    },
    {
      name: "help",
      action: () => this.showHelp()
      }
    ];
    const helpAnchor =
      <div className="toolbar-button">
        <div><i style={{fontSize: "30px"}} className="icon-codap-help" /></div>
        <div
          style={{
            fontSize: "12px",
            textTransform: "none",
            fontFamily: "'Montserrat', sans-serif"
          }}
        >
          About
        </div>
      </div>;

    return (
      <div>
        <div className="misc-actions toolbar">
          <div className="toolbar-button">
            <DropDownView
              anchor={helpAnchor}
              items={options}
              hideArrow={true}
              isActionMenu={true}
              menuStyle={{right: "0px"}}
            />
          </div>
        </div>
      </div>
    );
  }

  private renderStandalone() {
    return (
      <div>
        <div className="misc-actions">
          <div className="toolbar-button">
            <div>
              <a href="https://concord.org/our-work/research-projects/building-models/" target="_blank"><i className="icon-codap-help" /></a>
            </div>
            <div>Help</div>
          </div>
        </div>
      </div>
    );
  }

  private showHelp = () => {
    const url = "https://concord.org/our-work/research-projects/building-models/";
    const win = window.open(url, "_blank");
    win.focus();
    console.log("help");
  }
  private showAbout = () => {
    const displaySeconds = 60;
    (window as any).showSplashScreen(displaySeconds);
  }

}
