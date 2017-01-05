tr = require './translate'

colors =
  yellow:
    name: tr("~COLOR.YELLOW")
    value: "#f7be33"
  darkBlue:
    name: tr("~COLOR.DARK_BLUE")
    value: "#105262"
  medBlue:
    name: tr("~COLOR.MED_BLUE")
    value: "#72c0cc"
  lightGray:
    name: tr("~COLOR.LIGHT_GRAY")
    value: "#aaa"
  darkGray:
    name: tr("~COLOR.DARK_GRAY")
    value: "#444"
  data:
    name: tr("~COLOR.DATA")
    value: "#e99373"

module.exports =
  colors: colors
  choices: [colors.yellow, colors.darkBlue, colors.medBlue]
