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
  GOOGLE_ASSISTANT_LOCATION_LATITUDE: 'GOOGLE_ASSISTANT_LOCATION_LATITUDE',
  GOOGLE_ASSISTANT_LOCATION_LONGITUDE: 'GOOGLE_ASSISTANT_LOCATION_LONGITUDE'
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

const cleanResponse = (response) => {
  const audioOut = response.audioOut
  const screenOutHtml = response.screenOutHtml
  delete response.audioOut
  delete response.screenOutHtml

  return { response, audioOut, screenOutHtml }
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

  async Build () {
  }

  async Start () {
    debug('Start called')
    this.client = new ActionsOnGoogle(
      {
        client_id: this.caps[Capabilities.GOOGLE_ASSISTANT_CLIENT_ID],
        client_secret: this.caps[Capabilities.GOOGLE_ASSISTANT_CLIENT_SECRET],
        refresh_token: this.caps[Capabilities.GOOGLE_ASSISTANT_REFRESH_TOKEN],
        type: this.caps[Capabilities.GOOGLE_ASSISTANT_TYPE]
      }
    )
    this.client.include.audioOut = true
    this.client._isNewConversation = true
    // client has start function too, but it uses i18n, which is not well configurable
    if (this.caps[Capabilities.GOOGLE_ASSISTANT_START_UTTERANCE]) {
      const startUtterance = this.caps[Capabilities.GOOGLE_ASSISTANT_START_UTTERANCE]
      debug(`Sending start utterance: ${startUtterance}`)
      const { response } = cleanResponse(await this.client.send(startUtterance))
      debug(`Received start response: ${util.inspect(response)}`)
      this.client._isNewConversation = false
    }
  }

  async UserSays (msg) {
    debug(`Request: ${msg.messageText}`)

    if (msg.LOCATION) {
      this.client.location = [
        (msg.LOCATION.LONGITUDE && parseFloat(msg.LOCATION.LONGITUDE)) || 0.0,
        (msg.LOCATION.LATITUDE && parseFloat(msg.LOCATION.LATITUDE)) || 0.0
      ]
      debug(`Using location: ${this.client.location}`)
    } else if (this.caps[Capabilities.GOOGLE_ASSISTANT_LOCATION_LATITUDE] && this.caps[Capabilities.GOOGLE_ASSISTANT_LOCATION_LONGITUDE]) {
      this.client.location = [
        parseFloat(this.caps[Capabilities.GOOGLE_ASSISTANT_LOCATION_LATITUDE]),
        parseFloat(mthis.caps[Capabilities.GOOGLE_ASSISTANT_LOCATION_LONGITUDE])
      ]
      debug(`Using location (from caps): ${this.client.location}`)
    }
    
    const { response, audioOut, screenOutHtml } = cleanResponse(await this.client.send(msg.messageText))
    debug(`Response (without audioOut and screenOut): ${util.inspect(response)}`)
    this.client._isNewConversation = false
    this.client.location = null

    const botMsg = {
      sender: 'bot',
      messageText: getMessageText(response),
      buttons: getButtons(response),
      media: getMedia(response),
      cards: getCards(response),
      sourceData: response,
      attachments: []
    }

    if (audioOut) {
      botMsg.attachments.push({
        name: 'google-assistant-response.mp3',
        mimeType: 'audio/mpeg',
        base64: audioOut.toString('base64')
      })
    }
    if (screenOutHtml) {
      botMsg.attachments.push({
        name: 'google-assistant-screen.html',
        mimeType: 'text/html',
        base64: Buffer.from(screenOutHtml).toString('base64')
      })
    }
    setTimeout(() => this.queueBotSays(botMsg), 0)
  }

  async Stop () {
    debug('Stop called')
    if (this.caps[Capabilities.GOOGLE_ASSISTANT_END_UTTERANCE]) {
      const endUtterance = this.caps[Capabilities.GOOGLE_ASSISTANT_END_UTTERANCE]
      debug(`Sending end utterance: ${endUtterance}`)
      const { response } = cleanResponse(await this.client.send(endUtterance))
      debug(`Received end response: ${util.inspect(response)}`)
    }
    this.client = null
  }

  async Clean () {
  }
}

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorGoogleAssistant
}
