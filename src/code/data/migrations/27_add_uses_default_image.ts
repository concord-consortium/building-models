const _ = require("lodash");

import { MigrationMixin } from "./migration-mixin";

const isDefaultImage = (paletteItem) => {
  const {source, title} = paletteItem.metadata;
  return (source === "internal" && (title === "Blank" || title === "Flow Variable"));
};

const migration = {
  version: "1.27.0",
  description: "Adds usesDefaultImage setting to nodes",
  date: "2022-01-31",

  doUpdate(data) {
    // get the image urls for the default images
    const defaultImageUrls: Record<string, boolean|undefined> = {};
    _.each(data.palette, (paletteItem) => {
      if (isDefaultImage(paletteItem)) {
        defaultImageUrls[paletteItem.image] = true;
      }
    });

    // update the nodes
    _.each(data.nodes, (node) => {
      node.data.usesDefaultImage = !!defaultImageUrls[node.data.image];
    });
  }
};

export const migration_27 = _.mixin(migration, MigrationMixin);
