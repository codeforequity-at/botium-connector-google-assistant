const debug = require('debug')('botium-connector-google-assistant')
const { ActionsOnGoogle } = require('./actions-on-google')
const _ = require('lodash')

const Capabilities = {
  GOOGLE_ASSISTANT_CLIENT_ID: 'GOOGLE_ASSISTANT_CLIENT_ID',
  GOOGLE_ASSISTANT_CLIENT_SECRET: 'GOOGLE_ASSISTANT_CLIENT_SECRET',
  GOOGLE_ASSISTANT_REFRESH_TOKEN: 'GOOGLE_ASSISTANT_REFRESH_TOKEN',
  GOOGLE_ASSISTANT_TYPE: 'GOOGLE_ASSISTANT_TYPE'
}

class BotiumConnectorGoogleAssistant {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = caps
  }

  Validate () {
    debug('Validate called')
    if (!this.caps[Capabilities.GOOGLE_ASSISTANT_CLIENT_ID]) throw new Error('GOOGLE_ASSISTANT_CLIENT_ID capability required')
    if (!this.caps[Capabilities.GOOGLE_ASSISTANT_CLIENT_SECRET]) throw new Error('GOOGLE_ASSISTANT_CLIENT_SECRET capability required')
    if (!this.caps[Capabilities.GOOGLE_ASSISTANT_REFRESH_TOKEN]) throw new Error('GOOGLE_ASSISTANT_REFRESH_TOKEN capability required')
    if (!this.caps[Capabilities.GOOGLE_ASSISTANT_TYPE]) throw new Error('GOOGLE_ASSISTANT_TYPE capability required')

    return Promise.resolve()
  }

  Build () {
    debug('Build called')
    this.client = new ActionsOnGoogle({
      client_id: this.caps[Capabilities.GOOGLE_ASSISTANT_CLIENT_ID],
      client_secret: this.caps[Capabilities.GOOGLE_ASSISTANT_CLIENT_SECRET],
      refresh_token: this.caps[Capabilities.GOOGLE_ASSISTANT_REFRESH_TOKEN],
      type: this.caps[Capabilities.GOOGLE_ASSISTANT_TYPE]
    })
    return Promise.all([this.tts.Build(), this.stt.Build(), this.avs.Build()])
  }

  Start () {
    debug('Start called')
    this.client.startWith('actionstest-1bc72')
    return Promise.resolve()
  }

  UserSays ({messageText}) {
    debug('UserSays called')
    return this.client.send(messageText)

  }

  Stop () {
    debug('Stop called')
    this.client.cancel()

    return Promise.resolve()
  }

  Clean () {
    debug('Clean called')

    this.credentials = null
    return Promise.resolve()
  }
}

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorGoogleAssistant
}
