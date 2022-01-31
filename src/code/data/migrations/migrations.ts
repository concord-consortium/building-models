/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Add new migrations here.
// I wasn't able to get automatic path globed `require` to work.

import { migration_01 } from "./01_base";
import { migration_02 } from "./02_add_relations";
import { migration_03 } from "./03_add_semi_quant_editing";
import { migration_04 } from "./04_add_min_max";
import { migration_05 } from "./05_add_settings_and_cap";
import { migration_06 } from "./06_add_palette_references";
import { migration_07 } from "./07_add_diagram_only_setting";
import { migration_08 } from "./08_add_simulation_settings";
import { migration_09 } from "./09_update_duration_settings";
import { migration_10 } from "./10_add_speed_and_cap";
import { migration_11 } from "./11_simulation_engine_settings";
import { migration_12 } from "./12_add_minigraphs_visibility";
import { migration_13 } from "./13_add_frames_to_nodes";
import { migration_14 } from "./14_remove_new_integration";
import { migration_15 } from "./15_update_less_relationship_formula";
import { migration_16 } from "./16_add_link_reasoning";
import { migration_17 } from "./17_remove_simulation_speed";
import { migration_18 } from "./18_serialize_experiment_number";
import { migration_19 } from "./19_add_relation_type";
import { migration_20 } from "./20_add_complexity";
import { migration_21 } from "./21_remove_experiment_number";
import { migration_22 } from "./22_add_combine_method";
import { migration_23 } from "./23_add_simulation_type";
import { migration_24 } from "./24_fix_simulation_type";
import { migration_25 } from "./25_ensure_combine_method";
import { migration_26 } from "./26_remove_minigraphs_visibility";
import { migration_27 } from "./27_add_uses_default_image";

export const migrations = [
  migration_01,
  migration_02,
  migration_03,
  migration_04,
  migration_05,
  migration_06,
  migration_07,
  migration_08,
  migration_09,
  migration_10,
  migration_11,
  migration_12,
  migration_13,
  migration_14,
  migration_15,
  migration_16,
  migration_17,
  migration_18,
  migration_19,
  migration_20,
  migration_21,
  migration_22,
  migration_23,
  migration_24,
  migration_25,
  migration_26,
  migration_27
];

export const migrationUpdate = (data, upToVersion: string | null = null) => {
  for (const m of migrations) {
    if (m.update) {
      data = m.update(data);
    }
    if (upToVersion && m.version === upToVersion) {
      // Optionally, apply migrations up to provided version. Useful for testing.
      return data;
    }
  }
  return data;
};

export const latestVersion = () => {
  return lastMigration().version;
};

export const lastMigration = () => {
  return migrations[migrations.length - 1];
};
