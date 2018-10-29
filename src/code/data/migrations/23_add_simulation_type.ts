/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");

import { AppSettingsStore } from "../../stores/app-settings-store";
import { MigrationMixin } from "./migration-mixin";

const migration = {
  version: "1.22.0",
  description: "Add simulation type",
  date: "2018-03-30",

  doUpdate(data) {
    if (data.settings == null) { data.settings = {}; }

    // previous complexities were:
    //  0: diagram only
    //  1: basic relationships
    //  2: expanded relationships
    //  3: collectors
    //
    // map these to
    //  0: simulation: diagramOnly / complexity: basic
    //  1: simulation: static      / complexity: basic
    //  2: simulation: static      / complexity: expanded
    //  3 (for models with nodes set up as collectors): simulation: time   / complexity: expanded
    //  3 (no collectors in model):                     simulation: static / complexity: expanded

    const previousComplexity = (data.settings.complexity != null) ? data.settings.complexity : 2;

    if (previousComplexity === 0) {
      data.settings.simulationType = AppSettingsStore.SimulationType.diagramOnly;
      return data.settings.complexity     = AppSettingsStore.Complexity.basic;
    } else if (previousComplexity === 1) {
      data.settings.simulationType = AppSettingsStore.SimulationType.static;
      return data.settings.complexity     = AppSettingsStore.Complexity.basic;
    } else if (previousComplexity === 2) {
      data.settings.simulationType = AppSettingsStore.SimulationType.static;
      return data.settings.complexity     = AppSettingsStore.Complexity.expanded;
    } else if (previousComplexity === 3) {
      const hasCollectors = data.nodes.some(node => node.data.isAccumulator);
      if (hasCollectors) {
        data.settings.simulationType = AppSettingsStore.SimulationType.time;
      } else {
        data.settings.simulationType = AppSettingsStore.SimulationType.static;
      }
      return data.settings.complexity     = AppSettingsStore.Complexity.expanded;
    }
  }
};

export const migration_23 = _.mixin(migration, MigrationMixin);
