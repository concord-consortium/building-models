/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");
const log = require("loglevel");
const Reflux = require("reflux");
import * as $ from "jquery";

import { resizeImage } from "../utils/resize-image";
import { initialPalette } from "../data/initial-palette";
import { internalLibrary, InternalLibraryItem } from "../data/internal-library";
import { undoRedoInstance } from "../utils/undo-redo";
import { ImportActions } from "../actions/import-actions";
import { Mixin } from "../mixins/components";
import { StoreUnsubscriber, StoreClass } from "./store-class";
import { ImageMetadata, ImageInfo } from "../views/preview-image-dialog-view";
const uuid           = require("uuid");
import { Node } from "../models/node";
import { urlParams } from "../utils/url-params";

export interface PalleteItem {
  image: string;
  metadata: ImageMetadata;
}

// TODO: Maybe loadData goes into some other action-set
export const PaletteActions = Reflux.createActions(
  [
    "addToPalette", "selectPaletteIndex", "selectPaletteItem",
    "restoreSelection", "itemDropped", "update", "delete",
    "addCollectionToPalette"
  ]
);

interface LibraryMap {
  [key: string]: InternalLibraryItem;
}

export declare class PaletteStoreClass extends StoreClass {
  public readonly palette: PalleteItem[];
  public readonly library: LibraryMap;
  public readonly collections: LibraryMap[];
  public readonly selectedPaletteItem: PalleteItem;
  public readonly selectedPaletteIndex: number;
  public readonly selectedPaletteImage: ImageInfo;
  public readonly imageMetadata: ImageMetadata;
  public inLibrary(node: Node): boolean;
  public inPalette(node: Node): boolean;
  public findByUUID(uuid: string): PalleteItem | undefined;
}

export const PaletteStore: PaletteStoreClass = Reflux.createStore({
  listenables: [PaletteActions, ImportActions],

  init() {
    this.initializeLibrary();
    this.initializePalette();
    this.initializeCollections();
    // prepare a template for new library items
    this.blankMetadata = {
      source: "external",
      title: "blank",
      link: "",
      license: ""
    };
    this.imageMetadata = _.clone(this.blankMetadata, true);

    // due to import order issues wait to resolve UndoRedo
    setTimeout(() => {
      this.undoManger = undoRedoInstance({debug: false});
    }, 1);
  },

  initializeLibrary() {
    this.library = {};
    return internalLibrary.map((node) =>
      this.addToLibrary(node));
  },

  initializePalette() {
    this.palette = [];
    for (const node of initialPalette) {
      this.addToPalette(node);
    }
    this.selectPaletteIndex(0);
    return this.updateChanges();
  },

  /**
   * Loads image collections from the JSON url defined at the url param "imageCollections".
   * The JSON file may either be a collection, with a "title" and "images", or a list of
   * collections under the key "collections".
   *
   * A bit of complexity is added to sort the final collections so that, regardless of how
   * they are nested (e.g. collections or collections next to collections of images), when
   * laid out in a tree we will sort in left-right order.
   */
  initializeCollections() {
    this.collections = [];
    if (urlParams.imageCollections) {

      const collectionsOrder = [urlParams.imageCollections];

      const collectionLoaded = (collection, url) => {
        collection.url = url;
        this.collections.push(collection);

        this.collections.sort((c1, c2) => {
          return collectionsOrder.indexOf(c1.url) - collectionsOrder.indexOf(c2.url);
        });

        this.updateChanges();
      };

      const loadCollection = (url) => {
        log.info(`loading collection ${url}`);
        return $.ajax({
          url,
          dataType: "json",
          success: data => {
            if (data.collections) {   // nested collection
              // first replace our current url in collectionsOrder with our new list
              collectionsOrder.splice(collectionsOrder.indexOf(url), 1, ...data.collections);
              // then recursively load nested collections
              data.collections.forEach(loadCollection);
            } else if (data.images) {
              collectionLoaded(data, url);
            }
            this.updateChanges();
          },
          error(xhr, status, err) {
            return log.error(url, status, err.toString());
          }
        });
      };
      loadCollection(urlParams.imageCollections);
    }
  },

  makeNodeSignature(node) {
    // 400 chars of a URL *might* be adequately unique,
    // but data urls are going to be more trouble.
    return node.image.substr(0, 400);
  },


  standardizeNode(node) {
    if (!node.image) { node.image = ""; }
    if (!node.key) { node.key = this.makeNodeSignature(node); }
    if (!node.uuid) { node.uuid = uuid.v4(); }
    return node.metadata || (node.metadata = _.clone(this.blankMetadata, true));
  },

  addToLibrary(node) {
    if (!this.inLibrary(node)) {
      this.standardizeNode(node);
      this.library[node.key] = node;
      resizeImage(node.image, dataUrl => node.image = dataUrl);
      return log.info(`library: ${this.library}`);
    }
  },

  onImport(data) {
    // reload the palette
    this.palette = [];
    if (data.palette) {
      for (let i = data.palette.length - 1; i >= 0; i--) {
        const p_item = data.palette[i];
        this.addToPalette(p_item);
      }
    }
    return this.updateChanges();
  },

  onUpdate(data) {
    if (this.selectedPaletteItem) {
      this.selectedPaletteItem = _.merge(this.selectedPaletteItem, data);
    } else {
      this.selectedPaletteItem = data;
    }
    return this.updateChanges();
  },

  onDelete(paletteItem) {
    if (paletteItem) {
      return this.undoManger.createAndExecuteCommand("deletePaletteItem", {
        execute: () => {
          this.removePaletteItem(paletteItem);
          return this.updateChanges();
        },
        undo: () => {
          this.addToPalette(paletteItem);
          return this.updateChanges();
        }
      }
      );
    }
  },

  addToPalette(node: ImageInfo) {
    // PaletteItems always get added to library first
    this.addToLibrary(node);
    if (!this.inPalette(node)) {
      this.palette.push(node);
      this.moveToFront(this.palette.length - 1);
      return this.selectPaletteIndex(0);
    }
  },

  onAddToPalette(node: ImageInfo) {
    return this.undoManger.createAndExecuteCommand("addPaletteItem", {
      execute: () => {
        this.addToPalette(node);
        return this.updateChanges();
      },
      undo:  () => {
        this.removePaletteItem(node);
        return this.updateChanges();
      }
    }
    );
  },

  addCollectionToPalette(collection: InternalLibraryItem[]) {
    this.undoManger.startCommandBatch();
    collection.forEach((image: ImageInfo) => {
      if (!this.inPalette(image)) {
        this.onAddToPalette(image);
      }
    });
    this.undoManger.endCommandBatch();
  },

  onSelectPaletteIndex(index) {
    // @moveToFront(index) if we want to add the selected item to front
    this.selectPaletteIndex(index);
    return this.updateChanges();
  },

  onSelectPaletteItem(item) {
    const index = _.indexOf(this.palette, item);
    this.selectPaletteIndex(index);
    return this.updateChanges();
  },

  selectPaletteIndex(index) {
    const maxIndex = this.palette.length - 1;
    const effectiveIndex = Math.min(maxIndex, index);
    this.lastSelection = (this.selectedIndex = effectiveIndex);
    this.selectedPaletteItem  = this.palette[effectiveIndex];
    return this.selectedPaletteImage = this.selectedPaletteItem != null ? this.selectedPaletteItem.image : undefined;
  },

  onRestoreSelection() {
    if (this.lastSelection > -1) {
      this.selectPaletteIndex(this.lastSelection);
    } else { this.selectPaletteIndex(0); }
    return this.updateChanges();
  },

  onSetImageMetadata(image, metadata) {
    log.info("Set Image metadata called");
    this.addToLibrary(image);
    const libraryItem = this.inLibrary(image);
    if (libraryItem) {
      libraryItem.metadata = metadata;
      this.imageMetadata = libraryItem.metadata;
      return this.updateChanges();
    } else {
      return alert("cant find library item");
    }
  },

  removePaletteItem(item) {
    // Try to select the same index as the deleted item
    const i = _.indexOf(this.palette, item);
    this.palette = _.without(this.palette, item);
    return this.selectPaletteIndex(i);
  },

  moveToFront(index) {
    return this.palette.splice(0, 0, this.palette.splice(index, 1)[0]);
  },

  inPalette(node) {
    // node in Pallete is standardized, arg node not always
    return _.find(this.palette, {key: node.key || this.makeNodeSignature(node)});
  },

  findByUUID(uuid) {
    return _.find(this.palette, {uuid});
  },

  inLibrary(node) {
    return this.library[node.key];
  },

  updateChanges() {
    const data = {
      palette: this.palette,
      library: this.library,
      collections: this.collections,
      selectedPaletteIndex: this.selectedIndex,
      selectedPaletteItem: this.selectedPaletteItem,
      selectedPaletteImage: this.selectedPaletteImage,
      imageMetadata: this.imageMetadata
    };

    log.info(`Sending changes to listeners: ${JSON.stringify(data)}`);
    return this.trigger(data);
  }
});

export interface PaletteMixinProps {}

export interface PaletteMixinState {
  palette: any; // TODO: get concrete type
  library: any; // TODO: get concrete type
  collections: any;
  selectedPaletteItem: PalleteItem;
  selectedPaletteIndex: any; // TODO: get concrete type
  selectedPaletteImage: any; // TODO: get concrete type
  imageMetadata: any; // TODO: get concrete type
}

export class PaletteMixin extends Mixin<PaletteMixinProps, PaletteMixinState> {
  private paletteUnsubscribe: StoreUnsubscriber;

  public componentDidMount() {
    return this.paletteUnsubscribe = PaletteStore.listen(this.handlePaletteChange);
  }

  public componentWillUnmount() {
    return this.paletteUnsubscribe();
  }

  private handlePaletteChange = (status) => {
    return this.setState({
      palette: status.palette,
      library: status.library,
      collections: status.collections,
      selectedPaletteIndex: status.selectedPaletteIndex,
      selectedPaletteItem: status.selectedPaletteItem,
      selectedPaletteImage: status.selectedPaletteImage,
      imageMetadata: status.imageMetadata
    });
  }
}

PaletteMixin.InitialState = () => {
  return {
    palette: PaletteStore.palette,
    library: PaletteStore.library,
    collections: PaletteStore.collections,
    selectedPaletteItem: PaletteStore.selectedPaletteItem,
    selectedPaletteIndex: PaletteStore.selectedPaletteIndex,
    selectedPaletteImage: PaletteStore.selectedPaletteImage,
    imageMetadata: PaletteStore.imageMetadata
  } as PaletteMixinState;
};

