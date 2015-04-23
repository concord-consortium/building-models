{div, i, span} = React.DOM

Dropdown = React.createFactory require './dropdown-view'
module.exports = React.createClass

  displayName: 'GlobalNav'

  mixins: [require '../../mixins/google-file-interface']

  getInitialState: ->
    @getInitialAppViewState {}

  componentDidMount: ->
    @createGoogleDrive()
  
  render: ->
    options = [
      name: 'New…',
      action: @newFile,
    ,
      name: 'Open…',
      action: @openFile
    ,
      name: 'Save…',
      action: @saveFile
    ,
      name: 'Save a Copy…',
      action: false
    ,
      name: 'Advanced Settings …',
      action: false
    ,
      name: 'Rename',
      action: @rename
     ]

    (div {className: 'wireframe-global-nav wireframe-non-placeholder'},
      (Dropdown {anchor: @props.filename, items: options, className:'wireframe-global-nav-content-filename'})
      (div {className: 'wireframe-global-nav-name-and-help'},
        (span {className: 'mockup-only'}, @props.username),
        (span {className: 'mockup-only'}, "HELP")
      )
    )
