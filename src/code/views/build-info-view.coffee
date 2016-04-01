{div, a, table, tr, td, i} = React.DOM
Migration = require "../data/migrations/migrations"

module.exports = BuildInfoView = React.createClass

  displayName: 'BuildInfoView'

  componentWillMount: ->
    build_info = $('html').find("meta[name='build-info']").attr('content')
    [date,tag,commit,commiter]= build_info.split(' ')
    @setState
      commit: commit
      date: date
      tag: tag
      commiter: commiter

  getInitialState: ->
    commit: 'somegithub sha'
    date: '2015-12-16'
    dataVersion: Migration.latestVersion()
    showing: false

  thisEncodedUrl: ->
    encodeURIComponent(window.location.toString())

  link: ->
    "https://github.com/concord-consortium/building-models/commit/#{@state.commit}"

  close: ->
    @setState
      showing: false

  open: ->
    @setState
      showing: true

  render: ->
    (div {className: 'build-info-bottom-bar'},
      (div {className: 'build-info-button', onClick:@open}, "built on #{@state.date}")
      if @state.showing
        className = "BuildInfoView"
        (div {className: "BuildInfoView", onClick: @close },
          (div {className: "content", onClick: (e)-> e.stopPropagation() },
            (div {className: "top", style: {textAlign: "right"}},
              (i {className: 'icon-codap-ex', style: {padding: 0, cursor: "pointer"}, onClick: @close }))
            (table {},
              (tr {className: "date"},
                (td {className: "key"}, "released on:")
                (td {className: "value"}, @state.date)
              )
              (tr {className: "commit"},
                (td {className: "key"}, "commit:")
                (td {className: "value"},
                  (a {href: @link(), target: "_blank"}, @state.commit)
                )
              )
              (tr {className: "tag"},
                (td {className: "key"}, "tag:")
                (td {className: "value"}, @state.tag)
              )
              (tr {className: "commit"},
                (td {className: "key"}, "commiter:")
                (td {className: "value"}, @state.commiter)
              )
              (tr {className: "buildInfo"},
                (td {className: "key"}, "data format version:")
                (td {className: "value"}, @state.dataVersion)
              )
            )
          )
        )
    )

#
# myView = React.createFactory BuildInfoView
# window.testComponent = (domID) -> ReactDOM.render myView({}), domID
