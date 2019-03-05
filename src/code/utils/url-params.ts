// http://stackoverflow.com/a/2880929
const params: UrlParams = {};
if (window && window.location && window.location.search) {
  let match;
  const pl = /\+/g;  // Regex for replacing addition symbol with a space
  const search = /([^&=]+)=?([^&]*)/g;
  const decode = (s) => decodeURIComponent(s.replace(pl, " "));
  const query  = window.location.search.substring(1);

  while ((match = search.exec(query))) {
    params[decode(match[1])] = decode(match[2]);
  }
}

export interface UrlParams {
  standalone?: string;
  collectorScale?: string;
  simplified?: string;
  lockdown?: string;
  hide?: string;
  lang?: string;
}

export const urlParams: UrlParams = params;
