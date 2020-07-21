import { CodapConnect } from "../models/codap-connect";

export const logEvent = (event: string, parameters: object = {}) => {
  const stringifiedParameters = JSON.stringify(parameters);
  const emptyParameters = stringifiedParameters === "{}";
  const replaceArgs = emptyParameters ? [] : [stringifiedParameters];
  const formatStr = emptyParameters ? `${event}` : `${event}: %@`;

  console.info(`LOG: ${formatStr.replace("%@", stringifiedParameters)}`);

  const codapConnect = CodapConnect.instance("building-models");
  if (codapConnect.log) {
    codapConnect.log(formatStr, replaceArgs);
  }
};
