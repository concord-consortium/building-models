import * as React from "react";
import * as $ from "jquery";
import { DropDownView } from "./dropdown-view";
import { tr } from "../utils/translate";

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
    const options = [{
      name: tr("~MENU.ABOUT.ABOUT"),
      action: () => this.showAbout()
    },
    {
      name: tr("~MENU.ABOUT.HELP"),
      action: () => this.showHelp()
      }
    ];
    const helpAnchor =
      <div className="toolbar-button">
        <div><i className="icon-codap-help big" /></div>
        <div>
          {tr("~MENU.ABOUT")}
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
              rightSide={true}
            />
          </div>
        </div>
      </div>
    );
  }

  private showHelp = () => {
    const url = "https://building-models-resources.concord.org/SageIntro/sageIntro-v5_01.html";
    const win = window.open(url, "_blank");
    (win as Window).focus();
  }

  private showAbout = () => {
    const displaySeconds = 60;
    (window as any).showSplashScreen(displaySeconds);
  }

}
