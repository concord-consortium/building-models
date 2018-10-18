/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const tr = require("./translate");

module.exports = function(imageName) {
  const link = document.createElement("a");
  link.setAttribute("href", imageName);
  const array = link.pathname.split("."), extension = array[array.length - 1];
  const valid = (["gif", "png", "jpg", "jpeg"].indexOf(extension.toLowerCase())) !== -1;
  if (!valid) {
    alert(tr("~DROP.ONLY_IMAGES_ALLOWED"));
  }
  return valid;
};
