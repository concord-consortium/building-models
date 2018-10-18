{div} = React.DOM

module.exports = React.createClass

  displayName: 'Modal'

  watchForEscape: (e) ->
    if e.keyCode is 27
      @props.close?()

  componentDidMount: ->
    $(window).on 'keyup', @watchForEscape

  componentWillUnmount: ->
    $(window).off 'keyup', @watchForEscape

  render: ->
    (div {className: 'modal'},
      (div {className: 'modal-background'})
      (div {className: 'modal-content'}, @props.children)
    )
