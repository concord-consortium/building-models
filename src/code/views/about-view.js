{div, a, i, h2, p, br} = React.DOM

module.exports = AboutView = React.createClass

  displayName: 'AboutView'

  componentWillMount: ->
    build_info = $('html').find("meta[name='build-info']").attr('content')
    year = build_info.split(' ')[0].split('-')[0]
    @setState
      year: year

  getInitialState: ->
    showing: false

  close: ->
    @setState
      showing: false

  open: ->
    @setState
      showing: true

  render: ->
    (div {},
      (div {className: 'misc-actions'},
        (i {className: "icon-codap-help", onClick: @open})
      )
      if @state.showing
        (div {className: "BuildInfoView", onClick: @close },
          (div {className: "content", onClick: (e)-> e.stopPropagation() },
            (div {className: "top", style: {textAlign: "right"}},
              (i {className: 'icon-codap-ex', style: {padding: 0, cursor: "pointer"}, onClick: @close }))
            (div {className: "inner", style: {paddingTop: 0, textAlign: "center"}},
              (h2 {}, "SageModeler")
              (p {},
                "Copyright © #{@state.year} The Concord Consortium. All rights reserved."
              )
              (p {},
                "This open-source software is licensed under the "
                (a {href: "https://github.com/concord-consortium/building-models/blob/master/LICENSE", target: '_blank'}, "MIT license")
                "."
              )
              (p {},
                "Please provide attribution to The Concord Consortium"
                (br {})
                "and the URL "
                (a {href: "https://concord.org/", target: '_blank'}, "https://concord.org")
                "."
              )
            )
          )
        )
    )

#
# myView = React.createFactory BuildInfoView
# window.testComponent = (domID) -> ReactDOM.render myView({}), domID
