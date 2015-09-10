{a, span} = React.DOM
tr = require '../utils/translate'

GoogleFileStore = require '../stores/google-file-store'
Dropdown = React.createFactory require './dropdown-view'
module.exports = React.createClass

  displayName: 'PublicLink'
  mixins: [ GoogleFileStore.mixin ]

  getDefaultProps: ->
    linkTitle: tr '~PUBLIC_LINK.OPEN'

  makeDocLink: ->
    oldHash = window.location.hash
    # Use CORS proxy service… (TBD: This service could dissapear)
    encodedLink = encodeURIComponent("http://cors.io/?u=#{@state.docLink}")
    "#url=#{encodedLink}"

  render: ->
    (span {className: 'link'},
      if @state.isPublic and @state.docLink
        window.location.hash=@makeDocLink()
        link = window.location.toString()
        (a {href:link, target:'_blank'}, @props.linkTitle)
    )
