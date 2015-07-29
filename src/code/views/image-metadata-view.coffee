xlat = require '../utils/translate'
licenses = require '../data/licenses'
PaletteManager = require '../models/palette-manager'

{div, table, tr, td, a, input, select, radio, p} = React.DOM

module.exports = React.createClass

  displayName: 'ImageMetadata'
  mixins: [require '../mixins/palette-listening']

  getInitialState: ->
    hostname: null

  hostname: ->
    # instead of using a regexp to extract the hostname use the dom
    link = document.createElement 'a'
    link.setAttribute 'href', @state.imageMetadata?.link
    link.hostname


  changed: ->
    newMetaData =
      title: @refs.title.getDOMNode().value
      link: @refs.link.getDOMNode().value
      license: @refs.license.getDOMNode().value
      source: 'external'

    PaletteManager.actions.setImageMetadata @state.selectedPaletteImage, newMetaData

  render: ->
    license = licenses.getLicense (@state.imageMetadata.license or 'public domain')

    (div {className: 'image-metadata'},
      if @state.imageMetadata.source is 'external'
        (div {key: 'external'},
          (table {},
            (tr {}, (td {}, xlat '~METADATA.TITLE'), (td {}, (input {ref: 'title', value: @state.imageMetadata.title, onChange: @changed})))
            (tr {}, (td {}, xlat '~METADATA.LINK'), (td {}, (input {ref: 'link', value: @state.imageMetadata.link, onChange: @changed})))
            (tr {}, (td {}, xlat '~METADATA.CREDIT'), (td {}, (select {ref: 'license', value: @state.imageMetadata.license, onChange: @changed},
              licenses.getRenderOptions @state.imageMetadata.license
            )))
          )
          (p {className: 'learn-more'}, (a {href: license.link, target: '_blank'}, "Learn more about #{license.fullLabel}"))
        )
      else
        (div {key: 'internal'},
          (p {},
            (div {}, "\"#{@state.imageMetadata.title}\"")
            (div {}, (a {href: @state.imageMetadata.link, target: '_blank'}, "See it on #{@hostname()}"))
          )
          (p {},
            (div {}, 'License')
            (div {}, (a {href: license.link, target: '_blank'}, license.label))
          )
        )
    )
