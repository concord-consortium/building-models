tr = require "../utils/translate"
module.exports =
  defaultTitle: ->
    tr "~NODE.UNTITLED"

  titlePlaceholder: ->
    @defaultTitle()

  isDefaultTitle: ->
    @props.title is @titlePlaceholder()

  displayTitleForInput: (proposedTitle) ->
    # For input fields, use 'placeholder' value @defaultTitle
    # to work, the 'value' attribute of the input should be blank
    if proposedTitle is @defaultTitle() then "" else proposedTitle

  maxTitleLength: ->
    35

  cleanupTitle: (newTitle, isComplete) ->
    cleanTitle = if isComplete then _.trim(newTitle) else newTitle
    cleanTitle = cleanTitle.substr(0, @maxTitleLength())
    cleanTitle = if isComplete then _.trim(cleanTitle) else cleanTitle
    cleanTitle = if cleanTitle.length > 0 then cleanTitle else @defaultTitle()
