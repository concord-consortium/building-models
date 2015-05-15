tr = require "../utils/translate"
module.exports =
  defaultTitle: ->
    tr "~NODE.UNTITLED"

  titlePlaceholder: ->
    @defaultTitle()

  displayTitleForInput: (proposedTitle) ->
    # For input fields, use 'placeholder' value @defaultTitle
    # to work, the 'value' attribute of the input should be blank
    if proposedTitle is @defaultTitle() then "" else proposedTitle

  maxTitleLength: ->
    35

  cleanupTitle: (newTitle) ->
    newTitle = newTitle.substr(0, @maxTitleLength())
    newTitle = if newTitle.length > 0 then newTitle else @defaultTitle()
