/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// FORMAT BEFORE THIS TRANSFORM: in serialized-test-data-0.1.js
// FORMAT AFTER THIS TRANSFORM:  in serialized-test-data-1.0.js

const migration = {
  version: "1.0.0",
  description: "The initial migrations from old mysystem style file format.",
  date: "2015-08-12",

  doUpdate(data) {
    this.updateNodes(data);
    this.updateLinks(data);
    return this.updatePalette(data);
  },

  updateNodes(data) {
    return data.nodes = _.map((data.nodes || []), node =>
      ({
        key: node.key,
        data: node
      })
    );
  },

  updateLinks(data) {
    return data.links = _.map((data.links || []), link =>
      ({
        sourceNode: link.sourceNodeKey,
        targetNode: link.targetNodeKey,
        sourceTerminal: link.sourceTerminal,
        targetTerminal: link.targetTerminal,
        title: link.title,
        color: link.color
      })
    );
  },

  updatePalette(data) {
    // don't do anything if a palette is already defined
    if (!data.palette) {
      data.palette = _.map(data.nodes, node =>
        ({
          image: node.data.image,
          key: node.data.image,  // TODO truncate this?
          title: node.data.title,
          metadata: {
            title: node.data.title,
            source: "external",
            link: null,
            license: "public domain"
          }
        })
      );
      return data.palette.push({
        title: "",
        image: "img/nodes/blank.png",
        key: "img/nodes/blank.png",
        metadata: {
          source: "internal",
          title: "Blank",
          link: null,
          license: "public domain"
        }
      });
    }
  }
};

module.exports = _.mixin(migration, require("./migration-mixin"));
