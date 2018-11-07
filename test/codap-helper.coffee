global.window = { location: '' }
global._      = require 'lodash'
global.log    = require 'loglevel'
global.Reflux = require 'reflux'

Sinon          = require('sinon')
requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"
CodapConnect = requireModel 'codap-connect'

module.exports =
  Stub: () ->
    @sandbox = Sinon.sandbox.create()
    @sandbox.stub CodapConnect, "instance", ->
      sendUndoableActionPerformed: -> return ''
      _createMissingDataAttributes: -> return ''
  UnStub: () ->
     CodapConnect.instance.restore()
