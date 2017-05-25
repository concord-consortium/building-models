# Add new migrations here.
# I wasn't able to get automatic path globed `require` to work with gulp.
migrations = [
  require "./01_base"
  require "./02_add_relations"
  require "./03_add_semi_quant_editing"
  require "./04_add_min_max"
  require "./05_add_settings_and_cap"
  require "./06_add_palette_references"
  require "./07_add_diagram_only_setting"
  require "./08_add_simulation_settings"
  require "./09_update_duration_settings"
  require "./10_add_speed_and_cap"
  require "./11_simulation_engine_settings"
  require "./12_add_minigraphs_visibility"
  require "./13_add_frames_to_nodes"
  require "./14_remove_new_integration"
  require "./15_update_less_relationship_formula"
  require "./16_add_link_reasoning"
  require "./17_remove_simulation_speed"
  require "./18_serialize_experiment_number"
  require "./19_add_relation_type"
]

module.exports =
  migrations: migrations
  update: (data) ->
    for m in migrations
      if m.update
        data = m.update(data)
    data

  latestVersion: ->
    @lastMigration().version

  lastMigration: ->
    migrations[migrations.length-1]
