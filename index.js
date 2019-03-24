const debug = require('debug')('botium-connector-google-assistant')
const { ActionsOnGoogle } = require('./src/actions-on-google')
const util = require('util')

const Capabilities = {
  GOOGLE_ASSISTANT_CLIENT_ID: 'GOOGLE_ASSISTANT_CLIENT_ID',
  GOOGLE_ASSISTANT_CLIENT_SECRET: 'GOOGLE_ASSISTANT_CLIENT_SECRET',
  GOOGLE_ASSISTANT_REFRESH_TOKEN: 'GOOGLE_ASSISTANT_REFRESH_TOKEN',
  GOOGLE_ASSISTANT_TYPE: 'GOOGLE_ASSISTANT_TYPE',
  GOOGLE_ASSISTANT_START_UTTERANCE: 'GOOGLE_ASSISTANT_START_UTTERANCE',
  GOOGLE_ASSISTANT_END_UTTERANCE: 'GOOGLE_ASSISTANT_END_UTTERANCE'
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
    if (!this.caps[Capabilities.GOOGLE_ASSISTANT_END_UTTERANCE]) throw new Error('GOOGLE_ASSISTANT_END_UTTERANCE capability required')

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
    return Promise.resolve()
  }

  Start () {
    debug('Start called')
    // client has start function too, but it uses i18n, which is not well configurable
    if (this.caps[Capabilities.GOOGLE_ASSISTANT_START_UTTERANCE]) {
      return this.client.send(this.caps[Capabilities.GOOGLE_ASSISTANT_START_UTTERANCE])
        .then((response) => {
          if (response.textToSpeech.length === 0) {
            throw Error(`Empty response, configuration invalid!\n${util.inspect(response)}`)
          }
        })
    } else {
      return Promise.resolve()
    }
  }

  UserSays ({messageText}) {
    debug('UserSays called')
    debug(`Request: ${messageText}`)
    return this.client.send(messageText)
      .then((response) => {
        debug(`Response: ${util.inspect(response)}`)
        setTimeout(() => this.queueBotSays({ sender: 'bot', messageText: response.textToSpeech.join(' ') }), 0)
      })
  }

  Stop () {
    debug('Stop called')
    return this.client.send(this.caps[Capabilities.GOOGLE_ASSISTANT_END_UTTERANCE])
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
