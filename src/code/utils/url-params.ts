// http://stackoverflow.com/a/2880929
const params = {};
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

export const urlParams: any = params;
