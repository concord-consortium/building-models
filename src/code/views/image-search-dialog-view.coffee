ImageDialogStore = require "../stores/image-dialog-store"

OpenClipart = require '../utils/open-clipart'
tr = require '../utils/translate'

{div, input, button, img, i, a, form, br} = React.DOM

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
    if @props.isDisabled(@props.imageInfo)
      (img {src: src, className: 'in-palette', title: (tr '~IMAGE-BROWSER.ALREADY-IN-PALETTE')})
    else
      (img {src: src, onClick: @clicked, title: @props.imageInfo.title})

module.exports = React.createClass
  displayName: 'ImageSearch'

  mixins: [require '../mixins/image-dialog-view', ImageDialogStore.mixin]

  getInitialState: ->
    @getInitialImageDialogViewState
      searching: false
      searched: false
      internalResults: []
      externalResults: []

  searchClicked: (e) ->
    e.preventDefault()
    @search limitResults: true

  showAllMatches: ->
    @search limitResults: false

  search: (options) ->
    query = $.trim @refs.search.value
    validQuery = query.length > 0

    queryRegEx = new RegExp query, 'i'
    internalResults = _.filter @props.internalLibrary, (node) ->
      queryRegEx.test node.title

    @setState
      query: query
      searchable: validQuery
      searching: validQuery
      searchingAll: validQuery and not options.limitResults
      searched: false
      internalResults: internalResults
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

  internalListSource: ->
    if @state.internalResults.length is 0
      _.map @props.internalLibrary
    else @state.internalResults

  render: ->
    showNoResultsAlert = @state.searchable and @state.searched and (@state.internalResults.length + @state.externalResults.length) is 0

    (div {className: 'image-search-dialog'},
      if @props.selectedImage?.image
        @renderPreviewImage()
      else
        (div {},
          (div {className: 'image-search-dialog-form'},
            (form {},
              (input {type: 'text', ref: 'search', placeholder: tr '~IMAGE-BROWSER.SEARCH_HEADER'})
              (input {type: 'submit', value: 'Search', onClick: @searchClicked})
            )
          ),

          if showNoResultsAlert
            (div {className: 'modal-dialog-alert'},
              tr '~IMAGE-BROWSER.NO_IMAGES_FOUND'
              (br {})
              tr '~IMAGE-BROWSER.TRY_ANOTHER_SEARCH'
            )

          (div {className: 'header'}, tr '~IMAGE-BROWSER.LIBRARY_HEADER'),
          (div {className: 'image-search-dialog-results'},
            if @state.internalResults.length is 0 and (@state.searching or @state.externalResults.length > 0)
              tr '~IMAGE-BROWSER.NO_INTERNAL_FOUND', query: @state.query
            else
              for node, index in @internalListSource()
                if node.image
                  (ImageSearchResult {key: index, imageInfo: node, clicked: @imageSelected, isDisabled: @isDisabledInInternalLibrary}) if node.image
          )

          if @state.searchable and not showNoResultsAlert
            (div {},
              (div {className: 'header'}, tr 'Openclipart.org Images'),
              (div {className: "image-search-dialog-results #{if @state.externalResults.length is @state.numExternalMatches then 'show-all' else ''}"},
                if @state.searching
                  (div {},
                    (i {className: "icon-codap-options spin"})
                    ' '
                    tr "~IMAGE-BROWSER.SEARCHING",
                      scope: if @state.searchingAll then 'all matches for ' else ''
                      query: @state.query
                  )
                else if @state.externalResults.length is 0
                  tr '~IMAGE-BROWSER.NO_EXTERNAL_FOUND', query: @state.query
                else
                  for node, index in @state.externalResults
                    (ImageSearchResult {key: index, imageInfo: node, clicked: @imageSelected, isDisabled: @isDisabledInExternalSearch})
              )
            )
          if @state.externalResults.length < @state.numExternalMatches
            (div {className: "image-search-dialog-results-text"},
              tr '~IMAGE-BROWSER.SHOWING_N_OF_M',
              numResults: @state.externalResults.length
              numTotalResults: @state.numExternalMatches
              query: @state.query
              (a {href: '#', onClick: @showAllMatches}, tr '~IMAGE-BROWSER.SHOW_ALL')
            )
        )
    )
