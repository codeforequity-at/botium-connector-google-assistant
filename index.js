const debug = require('debug')('botium-connector-google-assistant')
const { ActionsOnGoogle } = require('./src/actions-on-google')
const util = require('util')

const Capabilities = {
  GOOGLE_ASSISTANT_CLIENT_ID: 'GOOGLE_ASSISTANT_CLIENT_ID',
  GOOGLE_ASSISTANT_CLIENT_SECRET: 'GOOGLE_ASSISTANT_CLIENT_SECRET',
  GOOGLE_ASSISTANT_REFRESH_TOKEN: 'GOOGLE_ASSISTANT_REFRESH_TOKEN',
  GOOGLE_ASSISTANT_TYPE: 'GOOGLE_ASSISTANT_TYPE',
  GOOGLE_ASSISTANT_START_UTTERANCE: 'GOOGLE_ASSISTANT_START_UTTERANCE',
  GOOGLE_ASSISTANT_END_UTTERANCE: 'GOOGLE_ASSISTANT_END_UTTERANCE',
  GOOGLE_ASSISTANT_LOG_INCOMING_DEBUG_INFO: 'GOOGLE_ASSISTANT_LOG_INCOMING_DEBUG_INFO',
  GOOGLE_ASSISTANT_LOG_INCOMING_DATA: 'GOOGLE_ASSISTANT_LOG_INCOMING_DATA'
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
    if (this.caps[Capabilities.GOOGLE_ASSISTANT_LOG_INCOMING_DEBUG_INFO] !== true) this.caps[Capabilities.GOOGLE_ASSISTANT_LOG_INCOMING_DEBUG_INFO] = false
    if (this.caps[Capabilities.GOOGLE_ASSISTANT_LOG_INCOMING_DATA] !== true) this.caps[Capabilities.GOOGLE_ASSISTANT_LOG_INCOMING_DATA] = false

    return Promise.resolve()
  }

  Build () {
    debug('Build called')
    this.client = new ActionsOnGoogle(
      {
        client_id: this.caps[Capabilities.GOOGLE_ASSISTANT_CLIENT_ID],
        client_secret: this.caps[Capabilities.GOOGLE_ASSISTANT_CLIENT_SECRET],
        refresh_token: this.caps[Capabilities.GOOGLE_ASSISTANT_REFRESH_TOKEN],
        type: this.caps[Capabilities.GOOGLE_ASSISTANT_TYPE]
      },
      {
        logDebugInfo: this.caps[Capabilities.GOOGLE_ASSISTANT_LOG_INCOMING_DEBUG_INFO],
        logData: this.caps[Capabilities.GOOGLE_ASSISTANT_LOG_INCOMING_DATA]
      }
    )
    return Promise.resolve()
  }

  Start () {
    debug('Start called')
    // client has start function too, but it uses i18n, which is not well configurable
    if (this.caps[Capabilities.GOOGLE_ASSISTANT_START_UTTERANCE]) {
      return this.client.send(this.caps[Capabilities.GOOGLE_ASSISTANT_START_UTTERANCE])
        .then((response) => {
          if (response.textToSpeech.length === 0) {
            throw Error(`Empty response, configuration, or start utterance ${this.caps[Capabilities.GOOGLE_ASSISTANT_START_UTTERANCE]} invalid!\n${util.inspect(response)}`)
          }
        })
    } else {
      return Promise.resolve()
    }
  }

  UserSays ({ messageText }) {
    debug('UserSays called')
    debug(`Request: ${messageText}`)
    const getMessageText = (response) => {
      if (response.textToSpeech && response.textToSpeech.length) {
        // TODO /n instead of ' '
        return response.textToSpeech.join(' ')
      }
      // i was not able to mix textToSpeech with ssml
      // if I wanted to define this as response:
      // ['hello world', '<speak>Hello World</speak>']
      // then I got just SSML
      if (response.ssml && response.ssml.length) {
        return response.ssml.join('\n')
      }
      // just to be sure returning this field too as fallback
      if (response.displayText && response.displayText.length) {
        return response.displayText.join('\n')
      }

      return ''
    }

    const getButtons = (response) => {
      if (response.suggestions && response.suggestions.length) {
        return response.suggestions.map(s => ({ text: s }))
      }
      return []
    }

    return this.client.send(messageText)
      .then((response) => {
        debug(`Response: ${util.inspect(response)}`)
        setTimeout(() => this.queueBotSays({ sender: 'bot', messageText: getMessageText(response), buttons: getButtons(response) }), 0)
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
