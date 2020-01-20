const debug = require('debug')('botium-connector-google-assistant')
const { ActionsOnGoogle } = require('actions-on-google-testing/dist/actions-on-google')
const util = require('util')
const mime = require('mime-types')

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

const getCards = (response) => {
  let result = []
  if (response.cards) {
    result = result.concat(response.cards.map(c => {
      return {
        text: c.title || c.subtitle || c.text,
        subtext: c.subtitle,
        content: c.text,
        image: c.imageUrl && {
          mediaUri: c.imageUrl,
          mimeType: mime.lookup(c.imageUrl) || 'application/unknown',
          altText: c.imageAltText
        },
        buttons: c.buttons && c.buttons.map(b => ({ text: b.title, payload: b.url }))
      }
    }))
  }
  if (response.carousel) {
    result = result.concat(response.carousel.map(c => {
      return {
        text: c.title || c.description || c.text,
        image: c.imageUrl && {
          mediaUri: c.imageUrl,
          mimeType: mime.lookup(c.imageUrl) || 'application/unknown',
          altText: c.imageAltText
        }
      }
    }))
  }
  if (response.list && response.list.items) {
    result = result.concat(response.list.items.map(c => {
      return {
        text: c.title || c.description || c.text,
        image: c.imageUrl && {
          mediaUri: c.imageUrl,
          mimeType: mime.lookup(c.imageUrl) || 'application/unknown',
          altText: c.imageAltText
        }
      }
    }))
  }
  if (response.table && response.table.headers) {
    result = result.concat(response.table.headers.map(h => {
      return {
        text: h
      }
    }))
  }

  return result
}

const getMessageText = (response) => {
  let result = []
  if (response.textToSpeech && response.textToSpeech.length) {
    result = result.concat(response.textToSpeech)
  }

  if (response.ssml && response.ssml.length) {
    result = result.concat(response.ssml)
  }
  // just to be sure returning this field too as fallback
  if (response.displayText && response.displayText.length) {
    result = result.concat(response.displayText)
  }

  if (response.list && response.list.title) {
    result.push(response.list.title)
  }

  return result.join('\n')
}

const getButtons = (response) => {
  let result = []
  if (response.suggestions) {
    result = result.concat(response.suggestions.map(s => ({ text: s.title || s })))
  }
  if (response.linkOutSuggestion) {
    result.push({ text: response.linkOutSuggestion.name, payload: response.linkOutSuggestion.url })
  }

  return result
}

const getMedia = (response) => {
  const m = response.mediaResponse

  if (m) {
    const mediaUri = (m.largeImage || m.icon)
    return [{
      mediaUri,
      mimeType: mime.lookup(mediaUri) || 'application/unknown',
      altText: m.name || m.description
    }]
  }
  return []
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

  async Build() {
  }

  async Start () {
    debug('Start called')
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
    this.client._isNewConversation = true
    // client has start function too, but it uses i18n, which is not well configurable
    if (this.caps[Capabilities.GOOGLE_ASSISTANT_START_UTTERANCE]) {
      const startUtterance = this.caps[Capabilities.GOOGLE_ASSISTANT_START_UTTERANCE]
      debug(`Sending start utterance: ${startUtterance}`)
      const response = await this.client.send(startUtterance)
      debug(`Received start response: ${util.inspect(response)}`)
      this.client._isNewConversation = false
    }
  }

  async UserSays ({ messageText }) {
    debug('UserSays called')
    debug(`Request: ${messageText}`)

    const response = await this.client.send(messageText)
    debug(`Response: ${util.inspect(response)}`)
    this.client._isNewConversation = false
    setTimeout(() => this.queueBotSays({
      sender: 'bot',
      messageText: getMessageText(response),
      buttons: getButtons(response),
      media: getMedia(response),
      cards: getCards(response),
      sourceData: response
    }), 0)
  }

  async Stop () {
    debug('Stop called')
    if (this.caps[Capabilities.GOOGLE_ASSISTANT_END_UTTERANCE]) {
      const endUtterance = this.caps[Capabilities.GOOGLE_ASSISTANT_END_UTTERANCE]
      debug(`Sending end utterance: ${endUtterance}`)
      const response = await this.client.send(endUtterance)
      debug(`Received end response: ${util.inspect(response)}`)
    }
    this.client = null
  }

  async Clean() {
  }
}

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorGoogleAssistant
}
