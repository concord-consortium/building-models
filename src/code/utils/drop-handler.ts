import { resizeImage } from "./resize-image";
import { hasValidImageExtension } from "./has-valid-image-extension";
import { tr } from "../utils/translate";

export interface DropOnlyImages {
  allow: "onlyImages";
}
export interface DropAnythingIfIframed {
  allow: "anythingIfFramed";
  iframed: boolean;
}
export type DropType = DropOnlyImages | DropAnythingIfIframed;

export interface DropCallbackImageInfo {
  type: "image";
  name: string;
  title: string;
  image: string;
  metadata: {
    source: "external";
    title?: string;
    link?: string;
  };
}
export interface DropCallbackUrlInfo {
  type: "url";
  url: string;
  componentType?: string;
  name?: string;
}
export type DropCallbackInfo = DropCallbackImageInfo | DropCallbackUrlInfo;

export type DropCallback = (info: DropCallbackInfo) => void;

export const dropHandler = (dropType: DropType, e: React.DragEvent<HTMLDivElement>, callback: DropCallback) => {
  if (e.dataTransfer.files.length > 0) {
    for (const file of Array.from(e.dataTransfer.files)) {
      const isImage = hasValidImageExtension(file.name);
      if (isImage) {
        dropImageFileHandler(file, callback);
      } else if (dropType.allow === "onlyImages") {
        alert(tr("~DROP.ONLY_IMAGES_ALLOWED"));
      } else if (!dropType.iframed) {
        alert(tr("~DROP.ONLY_ALLOWED_IF_IFRAMED"));
      } else {
        dropAnyFileHandler(file, callback);
      }
    }
  } else {
    const url = e.dataTransfer.getData("URL");
    if (url) {
      const isImage = hasValidImageExtension(url);
      if (isImage) {
        dropImageUrlHandler(url, callback);
      } else if (dropType.allow === "onlyImages") {
        alert(tr("~DROP.ONLY_IMAGES_ALLOWED"));
      } else if (!dropType.iframed) {
        alert(tr("~DROP.ONLY_ALLOWED_IF_IFRAMED"));
      } else {
        dropAnyUrlHandler(url, callback);
      }
    }
  }
};

const dropImageFileHandler = (file: File, callback: DropCallback) => {
  const reader = new FileReader();
  reader.addEventListener("load", e => {
    resizeImage(reader.result, dataUrl =>
      callback({
        type: "image",
        name: file.name,
        title: (file.name.split("."))[0],
        image: dataUrl,
        metadata: {
          source: "external",
          title: (file.name.split("."))[0]
        }})
    );
  });
  reader.readAsDataURL(file);
};

const dropImageUrlHandler = (url: string, callback: DropCallback) => {
  return callback({
    type: "image",
    name: "",
    title: "",
    image: url,
    metadata: {
      source: "external",
      link: url
    }
  });
};

const dropAnyFileHandler = (file: File, callback: DropCallback) => {
  const reader = new FileReader();
  reader.addEventListener("load", e => {
    if (reader.result) {
      let url = reader.result.toString();
      const isCSV = file.name.match(/\.csv$/i);
      // csv import fails in CODAP if DG.GameView is selected
      // so we disable it when we get a csv dropped
      const componentType = isCSV ? undefined : "DG.GameView";
      if (isCSV) {
        // CODAP expects csv file data urls to be of type text/csv
        url = url.replace(/^data:([^;]*);/, "data:text/csv;");
      }
      callback({
        type: "url",
        url,
        componentType,
        name: file.name
      });
    }
  });
  reader.readAsDataURL(file);
};

const dropAnyUrlHandler = (url: string, callback: DropCallback) => {
  return callback({
    type: "url",
    url
  });
};
