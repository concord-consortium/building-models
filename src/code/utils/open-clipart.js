/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let OpenClipArt;
const MAX_NUMBER_OF_PAGES = 20;

module.exports = (OpenClipArt = {

  jqXHR: null,

  search(query, options, callback) {
    // abort the last request
    if (OpenClipArt.jqXHR != null) {
      OpenClipArt.jqXHR.abort();
    }

    const url = `https://openclipart.org/search/json/?query=${encodeURIComponent(query)}&sort=downloads&page=${options.page}&amount=24`;
    return OpenClipArt.jqXHR = $.getJSON(url, function(data) {
      const results = [];
      const page = Math.min(__guard__(data != null ? data.info : undefined, x => x.current_page) || 0, MAX_NUMBER_OF_PAGES);
      const numPages = Math.min(__guard__(data != null ? data.info : undefined, x1 => x1.pages) || 0, MAX_NUMBER_OF_PAGES);
      for (let item of Array.from((data != null ? data.payload : undefined))) {
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
      return callback(results, page, numPages);
    });
  }
});


function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}