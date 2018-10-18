/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = function(src, callback) {

  const fail = () => callback(src);

  if (typeof document !== 'undefined' && document !== null) {
    const maxWidth = 100;
    const maxHeight = 100;

    const img = document.createElement('img');
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = src;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let {width, height} = img;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      return callback(canvas.toDataURL('image/png'));
    };

    return img.onerror = e => fail();
  } else {
    return fail();
  }
};
