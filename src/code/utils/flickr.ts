/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const FLICKR_API_KEY = "1082174cc952ccc6a97412e9e14aaf88";

module.exports = {
  search(query, callback) {
    const url = `https://api.flickr.com/services/rest?method=flickr.photos.search&api_key=${FLICKR_API_KEY}&tags=${encodeURIComponent(query)}&is_commons=1&safe_search=1&format=json&jsoncallback=?`;
    return $.getJSON(url, function(data, textStatus, jqXHR) {
      const results = [];
      for (let photo of Array.from(__guard__(data != null ? data.photos : undefined, x => x.photo))) {
        results.push({
          title: photo.title,
          image: `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_q.jpg`
        });
      }
      return callback(results);
    });
  }
};

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}