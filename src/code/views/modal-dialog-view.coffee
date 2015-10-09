Modal = React.createFactory require './modal-view'
{div, i} = React.DOM

module.exports = React.createClass

  displayName: 'ModalDialog'

  close: ->
    @props.close?()

  render: ->
    (Modal {close: @props.close},
      (div {className: 'modal-dialog'},
        (div {className: 'modal-dialog-wrapper'},
          (div {className: 'modal-dialog-title'},
            (i {className: "modal-dialog-title-close icon-codap-ex", onClick: @close})
            @props.title or 'Untitled Dialog'
          )
          (div {className: 'modal-dialog-workspace'}, @props.children)
        )
      )
    )
