xlat = require '../utils/translate'

{div, table, tr, td, a, input} = React.DOM

module.exports = React.createClass

  displayName: 'ImageMetadata'

  getInitialState: ->
    hostname: null

  componentWillMount: ->
    # instead of using a regexp to extract the hostname use the dom
    link = document.createElement 'a'
    link.setAttribute 'href', @props.metadata.link
    @setState hostname: link.hostname

  changed: ->
    newMetaData =
      title: @refs.title.getDOMNode().value
      link: @refs.link.getDOMNode().value
    metadata = _.extend @props.metadata, newMetaData
    @props.setImageMetadata @props.image, metadata

  render: ->
    [title, link] = if @props.metadata.source is 'external'
      [(input {ref: 'title', value: @props.metadata.title, onChange: @changed}), (input {ref: 'link', value: @props.metadata.link, onChange: @changed})]
    else
      [@props.metadata.title, (a {href: @props.metadata.link, target: '_blank'}, @state.hostname)]

    (div {className: 'image-metadata'},
      (table {},
        (tr {}, (td {}, xlat '~METADATA.TITLE'), (td {}, title))
        (tr {}, (td {}, xlat '~METADATA.LINK'), (td {}, link))
      )
    )
