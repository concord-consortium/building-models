/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const MAX_NUMBER_OF_PAGES = 20;

let jqXHR;

export const OpenClipArt = {

  search(query, options, callback) {
    // abort the last request
    if (jqXHR) {
      jqXHR.abort();
    }

    const url = `https://openclipart.org/search/json/?query=${encodeURIComponent(query)}&sort=downloads&page=${options.page}&amount=24`;

    jqXHR = $.getJSON(url, (data) => {
      const results: any[] = [];
      const page = Math.min(__guard__(data != null ? data.info : undefined, x => x.current_page) || 0, MAX_NUMBER_OF_PAGES);
      const numPages = Math.min(__guard__(data != null ? data.info : undefined, x1 => x1.pages) || 0, MAX_NUMBER_OF_PAGES);
      if (data.payload) {
        for (const item of data.payload) {
          results.push({
            image: item.svg.png_thumb,
            metadata: {
              source: "search",
              title: item.title,
              description: item.description,
              link: item.detail_link
            }
          });
        }
      }
      return callback(results, page, numPages);
    });
  }
};

module.exports = OpenClipArt;

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
