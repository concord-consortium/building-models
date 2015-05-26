IframePhoneRpcEndpoint = require '../../vendor/iframe-phone-rpc-endpoint'

module.exports = class CodapConnect

  name: 'Building Models Tool'

  codapPhone: null

  initAccomplished: false

  init: ->
    log.info 'CodapConnect initializing'

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

  codapRequestHandler: (iCmd, iCallback) ->
    operation = iCmd.operation
    if operation
      args = iCmd.args
      switch operation
        when 'saveState'
          log.info 'Received saveState request from CODAP.'
        when 'restoreState'
          log.info 'Received restoreState request from CODAP.'
        else
          log.info 'Unknown request received from CODAP: ' + operation

  initGameHandler: ->
    @initAccomplished = true
