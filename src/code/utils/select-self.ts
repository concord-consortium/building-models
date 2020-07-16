import { CodapConnect } from "../models/codap-connect";

let codapConnect: CodapConnect;

// sends a message to CODAP to select the component wrapping this app
export const selectSelf = () => {
  codapConnect = codapConnect || CodapConnect.instance("building-models");
  codapConnect.selectSelf();
};
