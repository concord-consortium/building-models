module.exports =
  componentDidMount: ->
    # Things to override in our classes
    doMove        = @doMove or -> undefined
    removeClasses = @removeClasses or ['proto-node']
    addClasses    = @addClasses or ['elm']
    domRef        = @refs.draggable or @

    # converts from a paletteItem to a element
    # in the diagram. (adding and removing css classes as required)
    reactSafeClone = (e) ->
      clone = $(@).clone(false)
      _.each removeClasses, (classToRemove) ->
        clone.removeClass classToRemove
      _.each addClasses, (classToAdd) ->
        clone.addClass classToAdd
      clone.attr('data-reactid', null)
      clone.find("*").each (i,v) ->
        $(v).attr('data-reactid', null)
      clone

    $(ReactDOM.findDOMNode(domRef)).draggable
      drag: @doMove
      revert: true
      helper: reactSafeClone
      revertDuration: 0
      opacity: 0.35
      appendTo: 'body'
      zIndex: 1000
