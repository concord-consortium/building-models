tr = require './translate'

units =
      STEP: 1
units.SECOND =  1
units.MINUTE = 60 * units.SECOND
units.HOUR   = 60 * units.MINUTE
units.DAY    = 24 * units.HOUR
units.WEEK   = 7 * units.DAY
units.MONTH  = 30 * units.DAY
units.YEAR   = 365 * units.DAY

toSeconds = (n, unit) ->
  n * units[unit]

module.exports =

  units: _.keys(units)

  defaultUnit: "STEP"

  toString: (unit, plural) ->
    number = if plural then ".PLURAL" else ""
    tr "~TIME.#{unit}#{number}"

  stepsInTime: (stepSize, stepUnit, period, periodUnit) ->
    stepSizeInSeconds = toSeconds stepSize, stepUnit
    periodInSeconds   = toSeconds period, periodUnit
    Math.floor periodInSeconds / stepSizeInSeconds
