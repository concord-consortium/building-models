IframePhoneRpcEndpoint = require '../../vendor/iframe-phone-rpc-endpoint'

module.exports = class CodapConnect

  name: 'Building Models Tool'

  codapPhone: null

  initAccomplished: false

  constructor: (linkManager, name) ->
    log.info 'CodapConnect initializing'
    @linkManager = linkManager
    name and @name = name

    @codapPhone = new IframePhoneRpcEndpoint( @codapRequestHandler,
      'codap-game', window.parent )

    @codapPhone.call( {
      action: 'initGame'
      args:
        name: @name
        dimensions:
          width: 800
          height: 600
        contextType: 'DG.DataContext'
    }, @initGameHandler)

  codapRequestHandler: (cmd, callback) =>
    operation = cmd.operation
    args = cmd.args

    switch operation
      when 'saveState'
        log.info 'Received saveState request from CODAP.'
        callback
          success: true
          state: @linkManager.serialize require '../data/initial-palette'

      when 'restoreState'
        log.info 'Received restoreState request from CODAP.'
        @linkManager.deleteAll()
        @linkManager.loadData args.state
        callback
          success: true
      else
        log.info 'Unknown request received from CODAP: ' + operation

  initGameHandler: =>
    @initAccomplished = true

  #
  # Requests a CODAP action, if the Building Models tool is configured to reside
  # in CODAP. For actions that may be requested, see
  # https://github.com/concord-consortium/codap/wiki/Data-Interactive-API .
  #
  # Similarly to the Google Drive API, this method will report results of its
  # asynchronous request either by invoking the provided callback, or, if no
  # callback is provided, will return a Promise.
  #
  # Example:
  #   codapConnect.request('logAction', {formatStr: 'test message'}).then ->
  #     log.info 'received log reply!'
  #

  request: (action, args, callback) ->
    promise = new Promise (resolve, reject) =>
      @codapPhone.call { action: action, args: args }, (reply) ->
        if callback
          callback reply
        if reply && reply.success
          resolve reply
        else
          reject 'CODAP request error'
    promise