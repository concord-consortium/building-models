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
  showTopology?: string;
  simulation?: string;
  timestep?: number;
  integration?: string;
  fullscreenButton?: string;    // whether to show fullscreen button (note: Document Store auomatically provides one)
  scaling?: string;             // whether to scale the app when not fullscreen, and also inform LARA our aspect ratio should be screen's AR
  /**
   * Image Collections are groups of images that we will display in the New Image dialog
   * in separate tabs. If one or more collections are defined, they will appear at the top
   * of the dialog, above the search options.
   * An image collection can either be a collection of images, or a collection of collections.
   * These could nest to an arbitrary depth, but the user will see a flat list of collections
   * of images.
   * Examples:
   *    Collection:
   *      ?imageCollections=image-collections/cbio/collections/population.json
   *    Collection of collections:
   *      ?imageCollections=image-collections/cbio/collections/population-cell.json
   */
  imageCollections?: string;
  showNodeRange?: string;
}

export const urlParams: UrlParams = params;

export const SHOW_NODE_RANGE = urlParams.showNodeRange === "true";

