import * as React from "react";
import * as ReactDOM from "react-dom";
import { ProcessCSVData } from "../process-sage";
import { XSLtoCSV } from "../process-xlsx";

export interface IDownloadLinkProps {
  csvString: string;
  fileName: string;
}

const DownloadLink = (props: IDownloadLinkProps) => {
  const {csvString, fileName} = props;
  const blob = new Blob([csvString], { type: "text/csv" });
  const downloadURL = window.URL.createObjectURL(blob);
  if (csvString && csvString.length > 0) {
    return (
      <div>
        <a href={downloadURL} download={fileName}>
          download {fileName}
        </a>
      </div>
    );
  }
  return(null);
};

interface ICSVFileRecord {
  content: string;
  fileName: string;
}

export interface IAppProps {
  userName: string;
  place: string;
}

export interface IAppState {
  CSVs: ICSVFileRecord[];
  status: string;
  running: boolean;
}

export class ReportApp extends React.Component<IAppProps, IAppState> {

  public static displayName = "AboutView";

  public state: IAppState = {
    CSVs: [],
    status: "starting",
    running: false,
  };

  public render() {
    const {running, status, CSVs} = this.state;
    const onChangeFile = (e) => this.handleFileChange(e);
    return (
      <div>
        <h1>
          Sage Model Topology Report Generator.
        </h1>

      <h2>Instructions:</h2>
      { running
        ?
          <div className="instructions">
            Please wait while your data is being loaded ...
            When the processing is complete click on the generated download links.
          </div>
        :
          <div className="instructions">
            <ol>
              <li>Select one or more ".xlsx" files from your computer by clicking the "Choose Files" button.</li>
              <li>Wait for the processing to complete, then click on the generated download links.</li>
            </ol>
          <hr/>
          <input type="file" id="input" multiple={true} accept=".xlsx" onChange={onChangeFile}/>
          </div>
      }

        <div className="status">
          {status}
        </div>

        <div className="links">
          {
            CSVs.map( (csv: ICSVFileRecord) => {
              return <DownloadLink key={csv.fileName} csvString={csv.content} fileName={csv.fileName} />;
            })
          }
        </div>
      </div>
    );
  }

  private setRunning(running: boolean) {
    this.setState({running});
  }

  private setStatus(status: string) {
    this.setState({status});
  }

  private addCSV(csv: ICSVFileRecord) {
    this.setState({CSVs: [... this.state.CSVs, csv]});
  }

  private setCSVs(CSVs: ICSVFileRecord[]) {
    this.setState({CSVs});
  }

  private async handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const csvs: ICSVFileRecord[] = [];
    this.setRunning(true);

    if (event.target.files) {
      for (const selectedFile of Array.from(event.target.files)) {
        const fn = selectedFile.name.replace(/\.xlsx?/i, ".csv");
        this.setStatus(`Working with ${fn}`);

        // Next line: I think there is something wrong with the File interface TD:
        const arrayBuff = await (selectedFile as any).arrayBuffer();
        const data = new Uint8Array(arrayBuff);
        const csvString = XSLtoCSV(data);
        const content = await ProcessCSVData(csvString, (msg: string) => {this.setStatus(`${fn} ${msg}`); });
        const processedCsv: ICSVFileRecord = {content, fileName: fn};
        csvs.push(processedCsv);
      }
    }
    this.setCSVs(csvs);
    this.setStatus("Complete.");
    this.setRunning(false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(
    <ReportApp userName="Researcher" place="report converter" />,
    document.getElementById("output")
  );
});

