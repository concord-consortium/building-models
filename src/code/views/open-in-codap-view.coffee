{a, span} = React.DOM
tr = require '../utils/translate'

Dropdown = React.createFactory require './dropdown-view'
module.exports = React.createClass

  displayName: 'OpenInCodap'

  getDefaultProps: ->
    linkTitle: tr '~OPEN_IN_CODAP.TITLE'
    codapUrl: "http://codap.concord.org/releases/latest/static/dg/en/cert/index.html"
    openInNewWindow: true

  thisEncodedUrl: ->
    encodeURIComponent(window.location.toString())

  link: ->
    "#{@props.codapUrl}?di=#{@thisEncodedUrl()}"

  render: ->
    opts = { href: @link() }

    if @props.openInNewWindow
      opts.target = "_blank"

    if @props.disabled
      opts.className = "disabled"
      opts.disabled = true
      opts.onClick = (e) ->
        e.preventDefault()
        alert tr "~OPEN_IN_COPDAP.DISABLED"

    (span {className: 'link'},
      (a opts, @props.linkTitle)
    )
