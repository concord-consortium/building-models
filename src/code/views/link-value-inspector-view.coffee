{div, h2, label, input, select, option, optgroup, button} = React.DOM

tr = require "../utils/translate"

module.exports = React.createClass

  displayName: 'LinkValueInspectorView'


  render: ->
    (div {className: 'link-inspector-view'},
      (div {className: 'inspector-content'},
        (h2 {}, "Link Value")
      )
    )
