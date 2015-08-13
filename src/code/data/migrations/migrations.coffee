# Add new migrations here.
# I wasn't able to get automatic path globed `require` to work with gulp.
migrations = [
  require "./01_base"
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
    _.max migrations, (m) -> m.version
