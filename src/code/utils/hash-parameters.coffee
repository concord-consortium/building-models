PARAM_TOKEN = /[?|&]/g
VALUE_TOKEN = "="

class HashParameters
  constructor: ->
    @parameters = {}

  decode: (string) ->
    decodeURIComponent(string)

  encode: (string) ->
    encodeURIComponent(string)

  fromLocationHash: ->
    @parameters = {}
    hash = @readHash()

    keyPairs = hash.split PARAM_TOKEN
    _.each keyPairs, (pair) =>
      if pair.match VALUE_TOKEN
        [key, value] = pair.split VALUE_TOKEN
        @parameters[key] = @decode value

  updateLocationhash: ->
    keys = _.keys @parameters
    strings = _.map keys, (key) =>
      value = @parameters[key]
      [key, @encode(value)].join VALUE_TOKEN
    @writeHash strings.join('&')

  setParam: (key,value) ->
    @parameters[key] = value
    @updateLocationhash()

  getParam: (key) ->
    @fromLocationHash()
    return @parameters[key]

  clearParam: (key) ->
    delete @parameters[key]
    @updateLocationhash()

  writeHash: (string) ->
    if window and window.location
      if string.length < 1
        window.location.hash = ""
      else
        window.location.hash = "?#{string}"

  readHash: ->
    if window and window.location
      # remove the leading slash
      hash = window.top.location.hash.substring(1)
    else
      ""


module.exports = new HashParameters()
