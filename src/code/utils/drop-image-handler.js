/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const resizeImage = require('./resize-image');
const hasValidImageExtension = require('../utils/has-valid-image-extension');

module.exports = function(e, callback) {
  if (e.dataTransfer.files.length > 0) {
    return (() => {
      const result = [];
      for (var file of Array.from(e.dataTransfer.files)) {
        if (hasValidImageExtension(file.name)) {
          const reader = new FileReader();
          reader.addEventListener('loadend', e =>
            resizeImage(e.target.result, dataUrl =>
              callback({
                name: file.name,
                title: (file.name.split('.'))[0],
                image: dataUrl,
                metadata: {
                  source: 'external',
                  title: (file.name.split('.'))[0]
                }})
          )
        );
          result.push(reader.readAsDataURL(file));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  } else {
    const url = e.dataTransfer.getData('URL');
    if (url && hasValidImageExtension(url)) {
      return callback({
        name: '',
        title: '',
        image: url,
        metadata: {
          source: 'external',
          link: url
        }
      });
    }
  }
};

