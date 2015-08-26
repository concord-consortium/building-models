{div, i, span} = React.DOM
tr = require '../utils/translate'

Dropdown = React.createFactory require './dropdown-view'
module.exports = React.createClass

  displayName: 'GlobalNav'

  mixins: [require '../mixins/google-file-interface']

  getInitialState: ->
    @getInitialAppViewState
      dirty: false
      canUndo: false
      saved: false

  componentDidMount: ->
    @createGoogleDrive()
    @props.graphStore.addChangeListener @modelChanged

  modelChanged: (status) ->
    @setState
      dirty: status.dirty
      canUndo: status.canUndo
      saved: status.saved

  render: ->
    options = [
      name: tr "~MENU.NEW"
      action: @newFile
    ,
      name: tr "~MENU.OPEN"
      action: @openFile
    ,
      name: tr "~MENU.SAVE"
      action: @saveFile
    ,
      name: tr "~MENU.SAVE_AS"
      action: false
    ,
      name: tr "~MENU.REVERT_TO_ORIGINAL"
      action: if @state.canUndo then @revertToOriginal else false
    ,
      name: tr "~MENU.REVERT_TO_LAST_SAVE"
      action: if @state.saved and @state.dirty then @revertToLastSave else false
    ,
      name: tr '~MENU.SETTINGS'
      action: false
    ]

    (div {className: 'global-nav'},
      (div {},
        (Dropdown {anchor: @props.filename, items: options, className:'global-nav-content-filename'})
        if @state.dirty
          (span {className: 'global-nav-file-status'}, 'Unsaved')
      )
      if @state.action
        (div {},
          (i {className: "fa fa-cog fa-spin"})
          @state.action
        )
      (div {className: 'global-nav-name-and-help'},
        (span {className: 'mockup-only'}, @props.username),
        (span {className: 'mockup-only'},
          (i {className: 'fa fa-2x fa-question-circle'})
        )
      )
    )
