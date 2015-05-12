xlat = require '../utils/translate'
licenses = require '../data/licenses'

{div, table, tr, td, a, input, select, radio, p} = React.DOM

module.exports = React.createClass

  displayName: 'ImageMetadata'

  getInitialState: ->
    hostname: null

  findHostname: (props) ->
    # instead of using a regexp to extract the hostname use the dom
    link = document.createElement 'a'
    link.setAttribute 'href', props.metadata.link
    @setState hostname: link.hostname

  componentWillMount: ->
    @findHostname @props

  componentWillReceiveProps: (nextProps) ->
    @findHostname nextProps if nextProps.metadata.link isnt @props.metadata.link

  changed: ->
    newMetaData =
      title: @refs.title.getDOMNode().value
      link: @refs.link.getDOMNode().value
      license: @refs.license.getDOMNode().value
    metadata = _.extend @props.metadata, newMetaData
    @props.setImageMetadata @props.image, metadata

  render: ->
    license = licenses.getLicense (@props.metadata.license or 'public domain')

    (div {className: 'image-metadata'},
      if @props.metadata.source is 'external'
        (div {key: 'external'},
          (table {},
            (tr {}, (td {}, xlat '~METADATA.TITLE'), (td {}, (input {ref: 'title', value: @props.metadata.title, onChange: @changed})))
            (tr {}, (td {}, xlat '~METADATA.LINK'), (td {}, (input {ref: 'link', value: @props.metadata.link, onChange: @changed})))
            (tr {}, (td {}, xlat '~METADATA.CREDIT'), (td {}, (select {ref: 'license', value: @props.metadata.license, onChange: @changed},
              licenses.getRenderOptions @props.metadata.license
            )))
          )
          (p {className: 'learn-more'}, (a {href: license.link, target: '_blank'}, "Learn more about #{license.fullLabel}"))
        )
      else
        (div {key: 'internal'},
          (p {},
            (div {}, "\"#{@props.metadata.title}\"")
            (div {}, (a {href: @props.metadata.link, target: '_blank'}, "See it on #{@state.hostname}"))
          )
          (p {},
            (div {}, 'License')
            (div {}, (a {href: license.link, target: '_blank'}, license.label))
          )
        )
    )
