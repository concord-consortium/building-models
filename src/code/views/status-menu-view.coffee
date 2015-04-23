GoogleFileView = React.createFactory require './google-file-view'

{div} = React.DOM

log.setLevel log.levels.TRACE

module.exports = React.createClass
  displayName: 'StatusMenu',

  openLink: ->
    if @props.getData
      window.open "#{window.location.protocol}//#{window.location.host}#{window.location.pathname}#data=#{encodeURIComponent @props.getData()}"

  render: ->
    (div {className: 'status-menu'},
      (div {className: 'title'}, @props.title or 'Building Models')
      (GoogleFileView {linkManager: @props.linkManager, getData: @props.getData, filename: @props.filename})
      (div {className: 'open-data-url', onClick: @openLink}, @props.linkText or 'Link to my model')
    )
