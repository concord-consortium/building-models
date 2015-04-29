xlat = require '../utils/translate'

{div, table, tr, td, a} = React.DOM

module.exports = React.createClass

  displayName: 'ImageMetadata'

  getInitialState: ->
    hostname: null

  componentWillMount: ->
    # instead of using a regexp to extract the hostname use the dom
    link = document.createElement 'a'
    link.setAttribute 'href', @props.metadata.link
    @setState hostname: link.hostname

  render: ->
    (div {className: 'image-metadata'},
      (table {},
        (tr {}, (td {}, xlat '~METADATA.TITLE'), (td {}, @props.metadata.title))
        (tr {}, (td {}, xlat '~METADATA.DESCRIPTION'), (td {}, @props.metadata.description))
        (tr {}, (td {}, xlat '~METADATA.MORE-INFO'), (td {}, (a {href: @props.metadata.link, target: '_blank'}, @state.hostname)))
      )
    )
