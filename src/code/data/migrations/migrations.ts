/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Add new migrations here.
// I wasn't able to get automatic path globed `require` to work.
const migrations = [
  require("./01_base"),
  require("./02_add_relations"),
  require("./03_add_semi_quant_editing"),
  require("./04_add_min_max"),
  require("./05_add_settings_and_cap"),
  require("./06_add_palette_references"),
  require("./07_add_diagram_only_setting"),
  require("./08_add_simulation_settings"),
  require("./09_update_duration_settings"),
  require("./10_add_speed_and_cap"),
  require("./11_simulation_engine_settings"),
  require("./12_add_minigraphs_visibility"),
  require("./13_add_frames_to_nodes"),
  require("./14_remove_new_integration"),
  require("./15_update_less_relationship_formula"),
  require("./16_add_link_reasoning"),
  require("./17_remove_simulation_speed"),
  require("./18_serialize_experiment_number"),
  require("./19_add_relation_type"),
  require("./20_add_complexity"),
  require("./21_remove_experiment_number"),
  require("./22_add_combine_method"),
  require("./23_add_simulation_type"),
  require("./24_fix_simulation_type"),
  require("./25_ensure_combine_method")
];

module.exports = {
  migrations,
  update(data) {
    for (const m of migrations) {
      if (m.update) {
        data = m.update(data);
      }
    }
    return data;
  },

  latestVersion() {
    return this.lastMigration().version;
  },

  lastMigration() {
    return migrations[migrations.length - 1];
  }
};
