/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { resizeImage } from "./resize-image";
import { hasValidImageExtension } from "../utils/has-valid-image-extension";

export const dropImageHandler = (e, callback) => {
  if (e.dataTransfer.files.length > 0) {
    return (() => {
      const result: any = [];
      for (const file of e.dataTransfer.files) {
        if (hasValidImageExtension(file.name)) {
          const reader = new FileReader();
          reader.addEventListener("load", e => {
            resizeImage(reader.result, dataUrl =>
              callback({
                name: file.name,
                title: (file.name.split("."))[0],
                image: dataUrl,
                metadata: {
                  source: "external",
                  title: (file.name.split("."))[0]
                }})
            );
          });
          result.push(reader.readAsDataURL(file));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  } else {
    const url = e.dataTransfer.getData("URL");
    if (url && hasValidImageExtension(url)) {
      return callback({
        name: "",
        title: "",
        image: url,
        metadata: {
          source: "external",
          link: url
        }
      });
    }
  }
};

