'use strict'
/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 *
 */
Object.defineProperty(exports, '__esModule', { value: true })
// Implementation of API calls to the Google Assistant
const grpc = require('grpc')
const protoFiles = require('google-proto-files')
const path = require('path')
const google_auth_library_1 = require('google-auth-library')
const i18n = require('i18n')
const SUPPORTED_LOCALES = [
  'en-US', 'fr-FR', 'ja-JP', 'de-DE', 'ko-KR',
  'es-ES', 'pt-BR', 'it-IT', 'ru-RU', 'hi-IN',
  'th-TH', 'id-ID', 'da-DK', 'no-NO', 'nl-NL',
  'sv-SE'
]
const FALLBACK_LOCALES = {
  'en-GB': 'en-US',
  'en-AU': 'en-US',
  'en-SG': 'en-US',
  'en-CA': 'en-US',
  'fr-CA': 'fr-FR',
  'es-419': 'es-ES'
}
const DEFAULT_LOCALE = SUPPORTED_LOCALES[0]
i18n.configure({
  locales: SUPPORTED_LOCALES,
  fallbacks: FALLBACK_LOCALES,
  directory: __dirname + '/locales',
  defaultLocale: DEFAULT_LOCALE
})
const PROTO_ROOT_DIR = protoFiles('..')
const embeddedAssistantPb = grpc.load({
  root: PROTO_ROOT_DIR,
  file: path.relative(PROTO_ROOT_DIR, protoFiles['embeddedAssistant'].v1alpha2)
}).google.assistant.embedded.v1alpha2
const latlngPb = grpc.load({
  root: PROTO_ROOT_DIR,
  file: path.relative(PROTO_ROOT_DIR, protoFiles['embeddedAssistant'].v1alpha2)
}).google.type.LatLng
/**
 * A class to handle requests to the Google Assistant for an Action.
 */
class ActionsOnGoogle {
  /**
   * Constructs a new ActionsOnGoogle object and initializes a gRPC client
   *
   * @param credentials Credentials for a given user to make authorized requests
   * @public
   */
  constructor (credentials) {
    /** @hidden */
    this._endpoint = 'embeddedassistant.googleapis.com'
    /** @hidden */
    this._isNewConversation = false
    /** @public */
    this.deviceModelId = 'default'
    /** @public */
    this.deviceInstanceId = 'default'
    this._client = this._createClient(credentials)
    this._locale = DEFAULT_LOCALE
  }
  /** @hidden */
  _createClient (credentials) {
    if (!credentials) {
      if (process.env.ACTIONS_TESTING_CLIENT_ID &&
        process.env.ACTIONS_TESTING_CLIENT_SECRET &&
        process.env.ACTIONS_TESTING_REFRESH_TOKEN) {
        credentials = {
          client_id: process.env.ACTIONS_TESTING_CLIENT_ID,
          client_secret: process.env.ACTIONS_TESTING_CLIENT_SECRET,
          refresh_token: process.env.ACTIONS_TESTING_REFRESH_TOKEN,
          type: 'authorized_user'
        }
      } else {
        throw new Error('Please provide ACTIONS_TESTING_CLIENT_ID,' +
          ' ACTIONS_TESTING_CLIENT_SECRET,' +
          ' ACTIONS_TESTING_REFRESH_TOKEN environment variables.')
      }
    }
    const sslCreds = grpc.credentials.createSsl()
    const refresh = new google_auth_library_1.UserRefreshClient()
    refresh.fromJSON(credentials)
    const callCreds = grpc.credentials.createFromGoogleCredential(refresh)
    const combinedCreds = grpc.credentials.combineChannelCredentials(sslCreds, callCreds)
    const client = new embeddedAssistantPb.EmbeddedAssistant(this._endpoint, combinedCreds)
    return client
  }
  /**
   * @deprecated This will be removed in future releases. Use `action.locale` instead.
   * @hidden
   */
  setLocale (l) {
    this.locale = l
  }
  /**
   * The locale of user-initiated requests
   *
   * @param l The locale to use in requests
   *
   * @example
   * ```javascript
   * const action = new ActionsOnGoogleAva(CREDENTIALS);
   * action.locale = 'fr-FR'
   * ```
   *
   * @public
   */
  set locale (l) {
    if (SUPPORTED_LOCALES.concat(Object.keys(FALLBACK_LOCALES)).indexOf(l) === -1) {
      console.warn(`Warning: Unsupported locale '${l}' in this tool. Ignore.`)
    }
    this._locale = l
    i18n.setLocale(l)
  }
  /** @hidden */
  i18n_ (name, params) {
    if (params) {
      return i18n.__(name, params)
    } else {
      return i18n.__(name)
    }
  }
  /**
   * @deprecated This will be removed at releasing a version 1.
   * @hidden
   */
  startConversation (prompt) {
    return this.start(prompt)
  }
  /**
   * Starts a conversation with "my test app"
   *
   * @param prompt An optional starting prompt to send to the Action as it is invoked
   * @return A Promise with the response from the Action
   *
   * @example
   * ```javascript
   * // Pass in optional user credentials or default to environment variables
   * const action = new ActionsOnGoogleAva(CREDENTIALS);
   * action.start() // "talk to my test app"
   *   then(res => {
   *     expect(res.textToSpeech[0]).to.be.equal('Welcome to my test app')
   *   })
   * ```
   *
   * @public
   */
  start (prompt) {
    return this.startWith(this.i18n_('my_test_app'), prompt)
  }
  /**
   * @deprecated This will be removed at releasing a version 1.
   * @hidden
   */
  startConversationWith (action, prompt) {
    return this.startWith(action, prompt)
  }
  /**
   * Starts a conversation with the provided Action
   *
   * @param action The name of the Action to invoke
   * @param prompt An optional starting prompt to send to the Action as it is invoked
   * @return A Promise with the response from the Action
   *
   * @example
   * ```javascript
   * // Pass in optional user credentials or default to environment variables
   * const action = new ActionsOnGoogleAva(CREDENTIALS);
   * action.startWith('number genie') // "talk to number genie"
   *   .then(res => {
   *     expect(res.textToSpeech[0]).to.be.equal('I am thinking of a number')
   *   })
   * ```
   *
   * @public
   */
  startWith (action, prompt) {
    const query = prompt
      ? this.i18n_('start_conversation_with_prompt', { app_name: action, prompt })
      : this.i18n_('start_conversation', { app_name: action })
    return this.send(query)
  }
  /**
   * @deprecated This will be removed at releasing a version 1.
   * @hidden
   */
  endConversation () {
    return this.cancel()
  }
  /**
   * Sends a cancel command to the Action, to end the conversation immediately
   *
   * @return A Promise with the response from the Action
   *
   * @example
   * ```javascript
   * // Pass in optional user credentials or default to environment variables
   * const action = new ActionsOnGoogleAva(CREDENTIALS);
   * action.startWith('number genie') // "talk to number genie"
   *   .then(res => {
   *      return action.cancel()
   *   }).then(res => {
   *      expect(res.textToSpeech[0]).to.be.equal('See you later')
   *   })
   * ```
   *
   * @public
   */
  cancel () {
    return this.send(this.i18n_('cancel'))
  }
  /**
   * Sends a text query to the Action
   *
   * @param input The user-provided query as text
   * @return A Promise with the response from the Action
   *
   * @example
   * ```javascript
   * // Pass in optional user credentials or default to environment variables
   * const action = new ActionsOnGoogleAva(CREDENTIALS);
   * action.startWith('number genie', 'about 50') // "talk to number genie about 50"
   *   .then(res => {
   *     return action.send('what about 49?')
   *   }).then(res => {
   *     expect(res.textToSpeech[0]).to.be.equal('You are very close')
   *   })
   * ```
   *
   * @public
   */
  send (input) {
    const config = new embeddedAssistantPb.AssistConfig()
    config.setTextQuery(input)
    config.setAudioOutConfig(new embeddedAssistantPb.AudioOutConfig())
    config.getAudioOutConfig().setEncoding(1)
    config.getAudioOutConfig().setSampleRateHertz(16000)
    config.getAudioOutConfig().setVolumePercentage(100)
    config.setDialogStateIn(new embeddedAssistantPb.DialogStateIn())
    config.setDeviceConfig(new embeddedAssistantPb.DeviceConfig())
    config.getDialogStateIn().setLanguageCode(this._locale)
    config.getDialogStateIn().setIsNewConversation(this._isNewConversation)
    if (this._conversationState) {
      config.getDialogStateIn().setConversationState(this._conversationState)
    }
    if (this.location) {
      const location = new embeddedAssistantPb.DeviceLocation()
      const coordinates = new latlngPb()
      coordinates.setLatitude(this.location[0])
      coordinates.setLongitude(this.location[1])
      location.setCoordinates(coordinates)
      config.getDialogStateIn().setDeviceLocation(location)
    }
    config.getDeviceConfig().setDeviceId(this.deviceInstanceId)
    config.getDeviceConfig().setDeviceModelId(this.deviceModelId)
    config.setDebugConfig(new embeddedAssistantPb.DebugConfig())
    config.getDebugConfig().setReturnDebugInfo(true) // Always debug
    const request = new embeddedAssistantPb.AssistRequest()

    request.setConfig(config)
    delete request.audio_in
    const conversation = this._client.assist()
    return new Promise((resolve, reject) => {
      const assistResponse = {
        micOpen: false,
        textToSpeech: [],
        displayText: [],
        ssml: [],
        suggestions: []
      }
      conversation.on('data', (data) => {
        if (data.dialog_state_out) {
          this._conversationState = data.dialog_state_out.conversation_state
          if (data.dialog_state_out.supplemental_display_text &&
            !assistResponse.displayText) {
            assistResponse.textToSpeech =
              [data.dialog_state_out.supplemental_display_text]
          }
        }
        if (data.device_action) {
          assistResponse.deviceAction = data.device_action.device_request_json
        }
        if (data.debug_info) {
          const debugInfo = JSON.parse(data.debug_info.aog_agent_to_assistant_json)
          const actionResponse = debugInfo.expectedInputs
            ? debugInfo.expectedInputs[0].inputPrompt.richInitialPrompt
            : debugInfo.finalResponse.richResponse
          assistResponse.micOpen = !!debugInfo.expectUserResponse
          // Process a carouselSelect or listSelect
          const possibleIntents = debugInfo.expectedInputs
            ? debugInfo.expectedInputs[0].possibleIntents : undefined
          if (possibleIntents) {
            const possibleIntent = possibleIntents[0]
            const inputValueData = possibleIntent.inputValueData
            if (inputValueData) {
              const carouselSelect = inputValueData.carouselSelect
              const listSelect = inputValueData.listSelect
              if (carouselSelect) {
                assistResponse.carousel = []
                for (const item of carouselSelect.items) {
                  assistResponse.carousel.push({
                    optionInfo: item.optionInfo,
                    title: item.title,
                    description: item.description,
                    imageUrl: item.image.url,
                    imageAltText: item.image.accessibilityText
                  })
                }
              }
              if (listSelect) {
                assistResponse.list = {
                  title: listSelect.title,
                  items: []
                }
                for (const item of listSelect.items) {
                  assistResponse.list.items.push({
                    optionInfo: item.optionInfo,
                    title: item.title,
                    description: item.description,
                    imageUrl: item.image.url,
                    imageAltText: item.image.accessibilityText
                  })
                }
              }
            }
          }
          // Process other response types
          // tslint:disable-next-line
          actionResponse.items.forEach((i) => {
            if (i.simpleResponse) {
              if (i.simpleResponse.textToSpeech) {
                assistResponse.textToSpeech.push(i.simpleResponse.textToSpeech)
              }
              if (i.simpleResponse.displayText) {
                assistResponse.displayText.push(i.simpleResponse.displayText)
              }
              if (i.simpleResponse.ssml) {
                assistResponse.ssml.push(i.simpleResponse.ssml)
              }
            } else if (i.basicCard) {
              assistResponse.cards = []
              const card = {
                title: i.basicCard.title,
                subtitle: i.basicCard.subtitle,
                text: i.basicCard.formattedText,
                imageUrl: i.basicCard.image
                  ? i.basicCard.image.url : undefined,
                imageAltText: i.basicCard.image
                  ? i.basicCard.image.accessibilityText : undefined,
                buttons: []
              }
              if (i.basicCard.buttons) {
                for (const button of i.basicCard.buttons) {
                  card.buttons.push({
                    title: button.title,
                    url: button.openUrlAction
                      ? button.openUrlAction.url : undefined
                  })
                }
              }
              assistResponse.cards.push(card)
            } else if (i.carouselBrowse) {
              assistResponse.carousel = []
              for (const item of i.carouselBrowse.items) {
                assistResponse.carousel.push({
                  title: item.title,
                  description: item.description,
                  footer: item.footer,
                  imageUrl: item.image ? item.image.url : undefined,
                  imageAltText: item.image
                    ? item.image.accessibilityText : undefined,
                  url: item.openUrlAction ? item.openUrlAction.url : undefined
                })
              }
            } else if (i.mediaResponse) {
              assistResponse.mediaResponse = {
                type: i.mediaResponse.mediaType,
                name: i.mediaResponse.mediaObjects[0].name,
                description: i.mediaResponse.mediaObjects[0].description,
                sourceUrl: i.mediaResponse.mediaObjects[0].contentUrl,
                icon: i.mediaResponse.mediaObjects[0].icon
                  ? i.mediaResponse.mediaObjects[0].icon.url : undefined,
                largeImage: i.mediaResponse.mediaObjects[0].largeImage
                  ? i.mediaResponse.mediaObjects[0].largeImage.url : undefined
              }
            } else if (i.tableCard) {
              assistResponse.table = {
                headers: [],
                rows: []
              }
              for (const property of i.tableCard.columnProperties) {
                assistResponse.table.headers.push(property.header)
              }
              for (const row of i.tableCard.rows) {
                const rowData = {
                  cells: [],
                  divider: row.dividerAfter
                }
                for (const cell of row.cells) {
                  rowData.cells.push(cell.text)
                }
                assistResponse.table.rows.push(rowData)
              }
            }
          })
          if (actionResponse.suggestions) {
            assistResponse.suggestions = []
            actionResponse.suggestions.forEach((i) => {
              if (i.title) {
                assistResponse.suggestions.push(i.title)
              }
            })
          }
          if (actionResponse.linkOutSuggestion) {
            assistResponse.linkOutSuggestion = {
              url: actionResponse.linkOutSuggestion.url,
              name: actionResponse.linkOutSuggestion.destinationName
            }
          }
        }
      })
      conversation.on('end', () => {
        // Conversation ended -- return response
        resolve(assistResponse)
      })
      conversation.on('error', (error) => {
        console.error(error)
        reject(error)
      })
      conversation.write(request)
      conversation.end()
    })
  }
}
exports.ActionsOnGoogle = ActionsOnGoogle
// # sourceMappingURL=actions-on-google.js.map