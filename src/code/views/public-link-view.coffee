{a, span} = React.DOM
tr = require '../utils/translate'

GoogleFileStore = require '../stores/google-file-store'
Dropdown = React.createFactory require './dropdown-view'
module.exports = React.createClass

  displayName: 'PublicLink'
  mixins: [ GoogleFileStore.mixin ]

  getDefaultProps: ->
    linkTitle: tr 'Open public link'

  makeDocLink: ->
    oldHash = window.location.hash
    encodedLink = encodeURIComponent(@state.docLink)
    if oldHash.length > 0
      "#{oldHash}&url=#{encodedLink}"
    else
      "#url=#{encodedLink}"

  render: ->
    (span {className: 'OpenInCodap'},
      if @state.isPublic and @state.docLink
        window.location.hash=@makeDocLink()
        link = window.location.toString()
        (a {href:link}, @props.linkTitle)
    )
