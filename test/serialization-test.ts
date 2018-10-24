/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
global.window = { location: '' };

const chai = require('chai');
chai.config.includeStack = true;

const { expect }         = chai;
const should         = chai.should();
const Sinon          = require('sinon');

const requireModel = name => require(`${__dirname}/../src/code/models/${name}`);
const Node           = requireModel('node');

describe("Serialization", () =>
  describe("for a single default Node", function() {
    beforeEach(function() {
      this.node = new Node({title: "a", x:10, y:15}, 'a');
      return this.serializedForm = this.node.toExport();
    });

    return describe("its serialized form", () =>
      it("should always include `combineMethod`", function() {
        return expect(this.serializedForm.data.combineMethod).to.equal('average');
      })
    );
  })
);
