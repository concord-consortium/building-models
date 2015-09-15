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
    unless hash.match PARAM_TOKEN
      return

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
    return @parameters[key]

  clearParam: (key) ->
    delete @parameters[key]
    @updateLocationhash()

  writeHash: (string) ->
    if string.length < 1
      window.location.hash = ""

    else
      window.location.hash = "?#{string}"

  readHash: ->
    # remove the leading slash
    hash = window.location.hash.substring(1)


module.exports = new HashParameters()
