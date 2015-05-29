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
