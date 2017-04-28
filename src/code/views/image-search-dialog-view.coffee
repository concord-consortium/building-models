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
      @setState loaded: true if not @unmounted

  componentWillUnmount: ->
    @unmounted = true

  clicked: ->
    ImageDialogStore.actions.update @props.imageInfo

  render: ->
    src = if @state.loaded then @props.imageInfo.image else 'img/bb-chrome/spin.svg'
    if not @props.isDisabled(@props.imageInfo)
      (img {src: src, onClick: @clicked, title: @props.imageInfo.metadata.title})
    else
      null

ImageSearchPageLink = React.createFactory React.createClass
  displayName: 'ImageSearchPageLink'

  selectPage: (e) ->
    e.preventDefault()
    e.stopPropagation()
    @props.selectPage @props.page

  render: ->
    if @props.currentPage is @props.page
      (span {className: 'image-search-page-link'}, @props.page)
    else
      (a {className: 'image-search-page-link', href: '#', onClick: @selectPage}, @props.page)

ImageSearchPrevNextLink = React.createFactory React.createClass
  displayName: 'ImageSearchPrevNextLink'

  selectPage: (e) ->
    e.preventDefault()
    e.stopPropagation()
    @props.selectPage @props.page

  render: ->
    if @props.enabled
      (a {className: 'image-search-prev-next-link', href: '#', onClick: @selectPage}, @props.label)
    else
      (span {className: 'image-search-prev-next-link', style: {color: "#777"}}, @props.label)

module.exports = React.createClass
  displayName: 'ImageSearch'

  mixins: [require '../mixins/image-dialog-view', ImageDialogStore.mixin]

  getInitialState: ->
    @getInitialImageDialogViewState
      searching: false
      searched: false
      results: []
      page: 1
      numPages: 0

  searchClicked: (e) ->
    e.preventDefault()
    @search
      page: 1
      newSearch: true

  selectPage: (page) ->
    @search
      page: page
      newSearch: false

  search: (options) ->
    query = $.trim @refs.search.value
    validQuery = query.length > 0
    @setState
      query: query
      searchable: validQuery
      searching: validQuery
      searched: false
      results: []
      page: if options.newSearch then 1 else options.page
      numPages: if options.newSearch then 0 else @state.numPages

    if validQuery
      OpenClipart.search query, options, (results, page, numPages) =>
        @setState
          searching: false
          searched: true
          results: results
          page: page
          numPages: numPages

  componentDidMount: ->
    @refs.search.focus()

  isDisabledInInternalLibrary: (node) ->
    @props.inPalette node

  isDisabledInExternalSearch: (node) ->
    (@props.inPalette node) or (@props.inLibrary node)

  renderPagination: ->
    if @state.numPages > 0
      (div {key: "pagination", className: "image-search-dialog-pagination"},
        (ImageSearchPrevNextLink {key: "prev", page: @state.page - 1, label: (tr "~IMAGE-BROWSER.PREVIOUS"), selectPage: @selectPage, enabled: @state.page > 1}),
        (ImageSearchPageLink({key: "page#{page}", page: page, currentPage: @state.page, selectPage: @selectPage}) for page in [1..@state.numPages])
        (ImageSearchPrevNextLink {key: "next", page: @state.page + 1, label: (tr "~IMAGE-BROWSER.NEXT"), selectPage: @selectPage, enabled: @state.page < @state.numPages})
      )

  render: ->
    showNoResultsAlert = @state.searchable and @state.searched and @state.results.length is 0

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
            if showNoResultsAlert
              (div {key: 'image-search-section', className: 'image-search-section', style: height: '100%'},[
                (div {key:'image-search-results', className: 'image-search-dialog-results show-all'},
                  for node, index in _.map @props.internalLibrary
                    if node.image
                      (ImageSearchResult {key: index, imageInfo: node, clicked: @imageSelected, isDisabled: @isDisabledInInternalLibrary}) if node.image
                )
              ])
            else
              (div {key: 'image-search-section-post-search', className: 'image-search-section', style: height: '100%'},[
                (div {key: 'results', className: "image-search-dialog-results"},
                  if @state.searching
                    (div {},
                      (i {className: "icon-codap-options spin"})
                      ' '
                      tr "~IMAGE-BROWSER.SEARCHING",
                        page: if @state.page is 1 then (tr "~IMAGE-BROWSER.SEARCHING_FIRST_PAGE") else (tr "~IMAGE-BROWSER.SEARCHING_PAGE", page: @state.page)
                        query: @state.query
                    )
                  else if @state.searched and @state.results.length is 0
                    tr '~IMAGE-BROWSER.NO_EXTERNAL_FOUND', query: @state.query
                  else
                    for node, index in @state.results
                      (ImageSearchResult {key: index, imageInfo: node, clicked: @imageSelected, isDisabled: @isDisabledInExternalSearch})
                )
                @renderPagination()
              ])
          ])
        )
    )
