ModalTabbedDialog = require './modal-tabbed-dialog-view'
ModalTabbedDialogFactory = React.createFactory ModalTabbedDialog
OpenClipart = require '../utils/open-clipart'
tr = require '../utils/translate'

{div, input, button, img, i, a} = React.DOM

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
      (div {className: 'image-browser-header'}, 'Preview Your Image')
      (div {className: 'image-browser-preview-image'},
        (img {src: @props.imageInfo.image})
        (a {href: '#', onClick: @cancel},
          (i {className: "fa fa-close"})
          'cancel'
        )
      )
      (div {className: 'image-browser-preview-add-image'},
        (button {onClick: @addImage}, 'Add Image')
      )
      (div {style: {clear: 'both', marginTop: 10}}, 'TBD: Metadata')
    )

ImageSearch = React.createFactory React.createClass
  displayName: 'ImageSearch'

  getInitialState: ->
    searching: false
    searched: false
    internalLibrary: @props.protoNodes
    internalResults: @props.protoNodes
    externalResults: []
    selectedImage: null

  changed: ->
    @search limitResults: true, useTimeout: true
  
  showAllMatches: ->
    @search limitResults: false, useTimeout: false
    
  search: (options) ->
    query = $.trim @refs.search.getDOMNode().value
    validQuery = query.length > 0
    
    queryRegEx = new RegExp query, 'i'
    internalResults = _.filter @props.protoNodes, (node) ->
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

    clearTimeout @searchTimeout
    search = =>
      OpenClipart.search query, options, (results, numMatches) =>
        @setState
          searching: false
          searched: true
          externalResults: results
          numExternalMatches: numMatches
    if options.useTimeout
      @searchTimeout = setTimeout search, 1000
    else
      search()

  componentDidMount: ->
    @refs.search.getDOMNode().focus()

  imageClicked: (imageInfo) ->
    @setState selectedImage: imageInfo

  addImage: (imageInfo) ->
    if imageInfo
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
            (input {ref: 'search', placeholder: 'Search Internal Library and Openclipart.org', value: @state.query, onChange: @changed})
            (button {}, 'Search')
          ),

          if showNoResultsAlert
            (div {className: 'modal-dialog-alert'}, 'Sorry, no images found.  Try another search, or browse internal library images below.')

          (div {className: 'image-browser-header'}, 'Internal Library Images'),
          (div {className: 'image-browser-results'},
            if @state.internalResults.length is 0 and (@state.searching or @state.externalResults.length > 0)
              " No internal library results found for '#{@state.query}'"
            else
              for node, index in (if showNoResultsAlert then @state.internalLibrary else @state.internalResults)
                if node.image and not node.image.match /^(https?|data):/
                  (ImageSearchResult {key: index, imageInfo: node, clicked: @imageClicked}) if node.image
          )

          if @state.searchable and not showNoResultsAlert
            (div {},
              (div {className: 'image-browser-header'}, 'Openclipart.org Images'),
              (div {className: 'image-browser-results'},
                if @state.searching
                  (div {},
                    (i {className: "fa fa-cog fa-spin"})
                    " Searching for #{if @state.searchingAll then 'all matches for ' else ''}'#{@state.query}'..."
                  )
                else if @state.externalResults.length is 0
                  " No openclipart.org results found for '#{@state.query}'"
                else
                  for node, index in @state.externalResults
                    (ImageSearchResult {key: index, imageInfo: node, clicked: @imageClicked})
              )
              if @state.externalResults.length < @state.numExternalMatches
                (div {},
                  "Showing #{@state.externalResults.length} of #{@state.numExternalMatches} matches for '#{@state.query}'. "
                  (a {href: '#', onClick: @showAllMatches}, 'Show all matches.')
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
    (ModalTabbedDialogFactory {title: (tr "~ADD-NEW-IMAGE.TITLE"), close: @props.close, tabs: [
      ModalTabbedDialog.Tab {label: (tr "~ADD-NEW-IMAGE.IMAGE-SEARCH-TAB"), component: (ImageSearch {protoNodes: @props.protoNodes, addToPalette: @props.addToPalette})}
      ModalTabbedDialog.Tab {label: (tr "~ADD-NEW-IMAGE.MY-COMPUTER-TAB"), component: (MyComputer {})}
      ModalTabbedDialog.Tab {label: (tr "~ADD-NEW-IMAGE.LINK-TAB"), component: (Link {})}
    ]})
