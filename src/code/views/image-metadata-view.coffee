xlat       = require '../utils/translate'
licenses   = require '../data/licenses'
ImageDialogStore = require '../stores/image-dialog-store'

{div, table, tr, td, a, input, select, radio, p} = React.DOM

module.exports = React.createClass

  displayName: 'ImageMetadata'


  getInitialState: ->
    hostname: null

  hostname: ->
    # instead of using a regexp to extract the hostname use the dom
    link = document.createElement 'a'
    link.setAttribute 'href', @props.metadata?.link
    link.hostname

  changed: ->
    newMetaData =
      title: @refs.title.value
      link: @refs.link.value
      license: @refs.license.value
      source: 'external'

    @props.update {metadata: newMetaData}

  render: ->
    (div {className: 'image-metadata'},
      if @props.metadata
        @renderMetadata()
    )

  renderMetadata: ->
    licenseName = @props.metadata.license or 'public domain'
    licenseData = licenses.getLicense licenseName
    title   = @props.metadata.title
    link    = @props.metadata.link

    if @props.metadata.source is 'external'
      (div {key: 'external'},
        (table {},
          (tr {}, (td {}, xlat '~METADATA.TITLE'),
            (td {},
              (input {ref: 'title', value: title, onChange: @changed})))

          (tr {}, (td {}, xlat '~METADATA.LINK'),
            (td {},
              (input {ref: 'link', value: link, onChange: @changed})))
          (tr {}, (td {}, xlat '~METADATA.CREDIT'),
            (td {},
              (select {ref: 'license', value: licenseName, onChange: @changed},
                licenses.getRenderOptions licenseName
          )))
        )
        (p {className: 'learn-more'}, (a {href: licenseData.link, target: '_blank'}, "Learn more about #{licenseData.fullLabel}"))
      )
    else
      (div {key: 'internal'},
        (p {})
        (div {}, "\"#{title}\"")
        if link
          (div {key: 'hostname'}, (a {href: link, target: '_blank'}, "See it on #{@hostname()}"))
        (p {})
        (div {}, 'License')
        (div {key: 'license'},
          (a {href: licenseData.link, target: '_blank'}, licenseData.label)
        )
      )
