tr              = require '../utils/translate'
{div, span, i}  = React.DOM

module.exports = React.createClass
  displayName: 'RecordButton'

  getDefaultProps: ->
    recording: false
    includeLight: false
    enabled: true
    icon: "icon-codap-video-camera"

  renderRecordingLight: ->
    if @props.includeLight
      classNames = ['recording-light']
      if @props.recording
        classNames.push 'recording'
      (div {className: 'recording-box vertical'},
        (div {className: classNames.join(" ")})
      )

  classNames: ->
    classes = ["button"]
    if @props.disabled
      classes.push("disabled")
    if @props.cantRecord
      classes.push("error")
    if @props.recording
      classes.push("recording")
    if @props.includeLight
      classes.push("bigger")
    classes.join(" ")

  render: ->
    verticalStyle = {}
    if @props.includeLight
      verticalStyle = {'paddingRight':'0.5em'}
    if @props.disabled
      onClick = -> null
    else
      onClick = @props.onClick
    (div {className: @classNames(), onClick: onClick},
      (div {className: 'horizontal'},
        (div {className: 'vertical', style: verticalStyle},
          @props.children
        )
        @renderRecordingLight()
      )
    )