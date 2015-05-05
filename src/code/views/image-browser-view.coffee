ModalTabbedDialog = require './modal-tabbed-dialog-view'
ModalTabbedDialogFactory = React.createFactory ModalTabbedDialog
ImageMetadata = React.createFactory require './image-metadata-view'
OpenClipart = require '../utils/open-clipart'
tr = require '../utils/translate'
resizeImage = require '../utils/resize-image'

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
    @props.clicked @props.imageInfo
  render: ->
    src = if @state.loaded then @props.imageInfo.image else 'img/bb-chrome/spin.svg'
    if @props.inPalette @props.imageInfo
      (img {src: src, className: 'in-palette', title: (tr '~IMAGE-BROWSER.ALREADY-IN-PALETTE')})
    else
      (img {src: src, onClick: @clicked, title: @props.imageInfo.title})

PreviewImage = React.createFactory React.createClass
  displayName: 'ImageSearchResult'
  cancel: (e) ->
    e.preventDefault()
    @props.addImage null
  addImage: ->
    @props.addImage @props.imageInfo
  render: ->
    (div {},
      (div {className: 'image-browser-header'}, tr '~IMAGE-BROWSER.PREVIEW')
      (div {className: 'image-browser-preview-image'},
        (img {src: @props.imageInfo.image})
        (a {href: '#', onClick: @cancel},
          (i {className: "fa fa-close"})
          'cancel'
        )
      )
      (div {className: 'image-browser-preview-add-image'},
        (button {onClick: @addImage}, tr '~IMAGE-BROWSER.ADD_IMAGE')
      )
      if @props.imageInfo.metadata
        (div {className: 'image-browser-preview-metadata'},
          (ImageMetadata {className: 'image-browser-preview-metadata', metadata: @props.imageInfo.metadata})
        )
    )

ImageSearch = React.createFactory React.createClass
  displayName: 'ImageSearch'

  getInitialState: ->
    searching: false
    searched: false
    internalLibrary: @props.internalLibrary
    internalResults: []
    externalResults: []
    selectedImage: null

  searchClicked: (e) ->
    e.preventDefault()
    @search limitResults: true

  showAllMatches: ->
    @search limitResults: false

  search: (options) ->
    query = $.trim @refs.search.getDOMNode().value
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
    @refs.search.getDOMNode().focus()

  imageClicked: (imageInfo) ->
    @setState selectedImage: imageInfo

  addImage: (imageInfo) ->
    if imageInfo and not @props.inPalette imageInfo
      resizeImage imageInfo.image, (dataUrl) =>
        imageInfo.image = dataUrl
        @props.addToPalette imageInfo
    @setState selectedImage: null

  render: ->
    showNoResultsAlert = @state.searchable and @state.searched and (@state.internalResults.length + @state.externalResults.length) is 0

    (div {className: 'image-browser'},
      if @state.selectedImage
        (PreviewImage {imageInfo: @state.selectedImage, addImage: @addImage})
      else
        (div {},
          (div {className: 'image-browser-form'},
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

          (div {className: 'image-browser-header'}, tr '~IMAGE-BROWSER.LIBRARY_HEADER'),
          (div {className: 'image-browser-results'},
            if @state.internalResults.length is 0 and (@state.searching or @state.externalResults.length > 0)
              tr '~IMAGE-BROWSER.NO_INTERNAL_FOUND', query: @state.query
            else
              for node, index in (if @state.internalResults.length is 0 then @state.internalLibrary else @state.internalResults)
                if node.image
                  (ImageSearchResult {key: index, imageInfo: node, clicked: @imageClicked, inPalette: @props.inPalette}) if node.image
          )

          if @state.searchable and not showNoResultsAlert
            (div {},
              (div {className: 'image-browser-header'}, tr 'Openclipart.org Images'),
              (div {className: 'image-browser-results'},
                if @state.searching
                  (div {},
                    (i {className: "fa fa-cog fa-spin"})
                    ' '
                    tr "~IMAGE-BROWSER.SEARCHING",
                      scope: if @state.searchingAll then 'all matches for ' else ''
                      query: @state.query
                  )
                else if @state.externalResults.length is 0
                  tr '~IMAGE-BROWSER.NO_EXTERNAL_FOUND', query: @state.query
                else
                  for node, index in @state.externalResults
                    (ImageSearchResult {key: index, imageInfo: node, clicked: @imageClicked, inPalette: @props.inPalette})
              )
              if @state.externalResults.length < @state.numExternalMatches
                (div {},
                  tr '~IMAGE-BROWSER.SHOWING_N_OF_M',
                    numResults: @state.externalResults.length
                    numTotalResults: @state.numExternalMatches
                    query: @state.query
                  (a {href: '#', onClick: @showAllMatches}, tr '~IMAGE-BROWSER.SHOW_ALL')
                )
            )
        )
    )

MyComputer = React.createFactory React.createClass
  displayName: 'MyComputer'
  render: ->
    (div {}, 'My Computer: TBD')

Link = React.createFactory React.createClass
  displayName: 'Link'
  render: ->
    (div {}, 'Link: TBD')

module.exports = React.createClass
  displayName: 'Image Browser'
  render: ->
    imageSearch = ImageSearch
      palette: @props.palette
      internalLibrary: @props.internalLibrary
      addToPalette: @props.addToPalette
      inPalette: @props.inPalette

    (ModalTabbedDialogFactory {title: (tr "~ADD-NEW-IMAGE.TITLE"), close: @props.close, tabs: [
      ModalTabbedDialog.Tab {label: (tr "~ADD-NEW-IMAGE.IMAGE-SEARCH-TAB"), component: imageSearch}
      ModalTabbedDialog.Tab {label: (tr "~ADD-NEW-IMAGE.MY-COMPUTER-TAB"), component: (MyComputer {})}
      ModalTabbedDialog.Tab {label: (tr "~ADD-NEW-IMAGE.LINK-TAB"), component: (Link {})}
    ]})
