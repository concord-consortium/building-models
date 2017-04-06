ImageDialogStore = require "../stores/image-dialog-store"

OpenClipart = require '../utils/open-clipart'
tr = require '../utils/translate'

{div, input, button, img, i, a, form, br, span} = React.DOM

ImageSearchResult = React.createFactory React.createClass
  displayName: 'ImageSearchResult'

  getInitialState: ->
    loaded: false

  componentDidMount: ->
    image = new Image()
    image.src = @props.imageInfo.image
    image.onload = =>
      @setState loaded: true

  clicked: ->
    ImageDialogStore.actions.update @props.imageInfo

  render: ->
    src = if @state.loaded then @props.imageInfo.image else 'img/bb-chrome/spin.svg'
    if not @props.isDisabled(@props.imageInfo)
      (img {src: src, onClick: @clicked, title: @props.imageInfo.title})
    else
      null


module.exports = React.createClass
  displayName: 'ImageSearch'

  mixins: [require '../mixins/image-dialog-view', ImageDialogStore.mixin]

  getInitialState: ->
    @getInitialImageDialogViewState
      searching: false
      searched: false
      externalResults: []

  searchClicked: (e) ->
    e.preventDefault()
    @search limitResults: true

  showAllMatches: ->
    @search limitResults: false

  search: (options) ->
    query = $.trim @refs.search.value
    validQuery = query.length > 0
    @setState
      query: query
      searchable: validQuery
      searching: validQuery
      searchingAll: validQuery and not options.limitResults
      searched: false
      externalResults: []
      numExternalMatches: 0

    OpenClipart.search query, options, (results, numMatches) =>
      @setState
        searching: false
        searched: true
        externalResults: results
        numExternalMatches: numMatches

  componentDidMount: ->
    @refs.search.focus()

  isDisabledInInternalLibrary: (node) ->
    @props.inPalette node

  isDisabledInExternalSearch: (node) ->
    (@props.inPalette node) or (@props.inLibrary node)

  render: ->
    showNoResultsAlert = @state.searchable and @state.searched and @state.externalResults.length is 0
    providerMessage = (div {key: "provider-message", className: "image-search-dialog-provider-message"}, tr '~IMAGE-BROWSER.PROVIDER_MESSAGE')

    (div {className: 'image-search-dialog'},
      if @props.selectedImage?.image
        @renderPreviewImage()
      else
        (div {},
          (div {className: 'image-search-dialog-form'},
            (form {},
              (input {type: 'text', ref: 'search', defaultValue: @state.query, placeholder: tr '~IMAGE-BROWSER.SEARCH_HEADER'})
              (input {type: 'submit', value: 'Search', onClick: @searchClicked})
            )
          ),

          if showNoResultsAlert
            (div {className: 'modal-dialog-alert'},
              tr '~IMAGE-BROWSER.NO_IMAGES_FOUND'
              (br {})
              tr '~IMAGE-BROWSER.TRY_ANOTHER_SEARCH'
            )

          (div {className: 'image-search-main-results'},[
            if not @state.searchable or showNoResultsAlert
              (div {key: 'image-search-section', className: 'image-search-section', style: height: '100%'},[
                (div {className: 'image-search-dialog-results show-all'},
                  for node, index in _.map @props.internalLibrary
                    if node.image
                      (ImageSearchResult {key: index, imageInfo: node, clicked: @imageSelected, isDisabled: @isDisabledInInternalLibrary}) if node.image
                )
                providerMessage
              ])
            else
              filteredExternalResultsAll = (@state.externalResults.filter (x) => not @isDisabledInExternalSearch x)
              filteredExternalResults = if @state.searchingAll then filteredExternalResultsAll else filteredExternalResultsAll[..23]
              header = if @state.externalResults.length < @state.numExternalMatches
                matchInfo = tr '~IMAGE-BROWSER.SHOWING_N_OF_M',
                  numResults: filteredExternalResults.length
                  numTotalResults: @state.numExternalMatches
                (span {}, matchInfo, (a {href: '#', onClick: @showAllMatches}, tr '~IMAGE-BROWSER.SHOW_ALL'))
              (div {className: 'image-search-section', style: height: '100%'},[
                (div {key: 'header', className: 'header'}, header),
                (div {key: 'results', className: "image-search-dialog-results #{if @state.externalResults.length is @state.numExternalMatches then 'show-all' else ''}"},
                  if @state.searching
                    (div {},
                      (i {className: "icon-codap-options spin"})
                      ' '
                      tr "~IMAGE-BROWSER.SEARCHING",
                        scope: if @state.searchingAll then 'all matches for ' else ''
                        query: @state.query
                    )
                  else if filteredExternalResults.length is 0
                    tr '~IMAGE-BROWSER.NO_EXTERNAL_FOUND', query: @state.query
                  else
                    for node, index in filteredExternalResults
                      (ImageSearchResult {key: index, imageInfo: node, clicked: @imageSelected, isDisabled: @isDisabledInExternalSearch})
                )
                providerMessage
              ])
          ])
        )
    )
