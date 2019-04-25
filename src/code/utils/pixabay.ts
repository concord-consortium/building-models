import * as $ from "jquery";
import { ImageInfo } from "../views/preview-image-dialog-view";

const MAX_NUMBER_OF_PAGES = 20;
const RESULTS_PER_PAGE = 20;
const API_KEY = "12305000-0700243496d727b013d9594bd";

let jqXHR;

interface PixabayResults {
  total: number;
  totalHits: number;
  hits: PixabayResultsHit[];
}

interface PixabayResultsHit {
  pageURL: string;
  webformatURL: string;
}

export const Pixabay = {

  search(query, options, callback: (results: ImageInfo[], page: number, numPages: number) => void) {
    // abort the last request
    if (jqXHR) {
      jqXHR.abort();
    }

    const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=illustration&safesearch=true&order=popular&page=${options.page}&per_page=${RESULTS_PER_PAGE}&callback=?`;

    jqXHR = $.getJSON(url, (result: PixabayResults) => {
      const results: ImageInfo[] = [];
      const numPages = Math.min(Math.ceil(result.totalHits / RESULTS_PER_PAGE), MAX_NUMBER_OF_PAGES);
      const page = Math.min(options.page, numPages);
      for (const hit of result.hits) {
        results.push({
          image: hit.webformatURL, // NOTE: the docs say you can replace the `_640` the url with any width to get smaller images but tests show this does not work for all images
          metadata: {
            source: "search",
            title: `"${query}" via Pixabay search`,
            description: "n/a",
            link: hit.pageURL,
            license: "pixabay"
          }
        });
      }
      return callback(results, page, numPages);
    });
  }
};
