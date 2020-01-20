#!/usr/bin/env node
const util = require('util')
const jsonutil = require('jsonutil')
const fs = require('fs')
const readlineSync = require('readline-sync')
const { OAuth2Client } = require('google-auth-library')

const BotiumConnectorGoogleAssistant = require('../index').PluginClass

const DEFAULT_GOOGLE_CONFIG = 'googleConfig.json'
const DEFAULT_START_UTTERANCE = 'Talk to my test app'
const DEFAULT_END_UTTERANCE = 'Cancel'
const OUTPUT_JSON = 'botium.json'

const _extractArgs = () => {
  const result = {}
  do {
    result.googleConfigPath = readlineSync.question(`\nGoogle config path? (${DEFAULT_GOOGLE_CONFIG}) `, {
      defaultInput: DEFAULT_GOOGLE_CONFIG
    })
    try {
      result.googleConfig = jsonutil.readFileSync(result.googleConfigPath)
    } catch (ex) {
      console.log(`\nCan not load "${result.googleConfigPath}". (${ex})`)
    }
  } while (!result.googleConfig)

  // if (readlineSync.question(`\nFile ${OUTPUT_JSON} already exists. Continue? [Y/n] `, {limit: /(y|n|)/}) === 'n') {
  result.useStartUtterance = readlineSync.question(`\nUse start utterance like "${DEFAULT_START_UTTERANCE}" to activate action? [Y/n] `, { limit: /(y|n|)/ }) !== 'n'

  if (result.useStartUtterance) {
    result.startUtterance = readlineSync.question(`\nStart utterance? (${DEFAULT_START_UTTERANCE}) `, {
      defaultInput: DEFAULT_START_UTTERANCE
    })
  }

  result.endUtterance = readlineSync.question(`\nEnd utterance? (${DEFAULT_END_UTTERANCE}) `, {
    defaultInput: DEFAULT_END_UTTERANCE
  })

  return result
}

const _authorize = (args) => {
  const clientId = args.googleConfig.installed.client_id
  const clientSecret = args.googleConfig.installed.client_secret

  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob'
  )
  const scopes = [
    'https://www.googleapis.com/auth/assistant-sdk-prototype'
  ]

  console.log(`\nReading data for project "${args.googleConfig.installed.project_id}"`)

  console.log('\nPlease go to the following link to authorize, then copy the code below')
  // Google OAuth URL to enable the Assistant SDK API for the given client id

  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',

    // If you only need one scope you can pass it as a string
    scope: scopes
  })

  console.log(url)

  const code = readlineSync.question('Authorization code? ')

  // Use this code to obtain a refresh token
  return oauth2Client.getToken(code)
    .then(({ tokens }) => tokens)
}

const _createCapabilities = (args, authResult) => {
  return {
    PROJECTNAME: 'Botium Project Google Assistant',
    CONTAINERMODE: 'google-assistant',
    GOOGLE_ASSISTANT_CLIENT_ID: args.googleConfig.installed.client_id,
    GOOGLE_ASSISTANT_CLIENT_SECRET: args.googleConfig.installed.client_secret,
    GOOGLE_ASSISTANT_REFRESH_TOKEN: authResult.refresh_token,
    GOOGLE_ASSISTANT_TYPE: 'authorized_user',
    GOOGLE_ASSISTANT_START_UTTERANCE: args.startUtterance,
    GOOGLE_ASSISTANT_END_UTTERANCE: args.endUtterance
  }
}

const _main = async () => {
  // 1) does json already exist?
  if (fs.existsSync(OUTPUT_JSON)) {
    if (readlineSync.question(`\nFile ${OUTPUT_JSON} already exists. Continue? [Y/n] `, { limit: /(y|n|)/ }) === 'n') {
      console.log('\n\nexiting....')
      return
    }
  }

  // 2) get args from user
  const args = _extractArgs()

  // 3) authorize
  const authResult = await _authorize(args)
  console.log(`\nToken acquired: \n${util.inspect(authResult)}`)

  // 5) create capabilities.
  const caps = _createCapabilities(args, authResult)
  const asString = JSON.stringify(caps, null, 2)
  console.log(`\nBotium Capabilities (to use for copy & paste):\n ${asString}`)
  if (!fs.existsSync(OUTPUT_JSON) || readlineSync.question(`\nFile ${OUTPUT_JSON} already exists. Overwrite? [y/N] `, { limit: /(y|n|)/ }) === 'y') {
    const botiumJsonAsString = JSON.stringify({
      botium: {
        Capabilities: caps

      }
    }, null, 2)
    fs.writeFileSync(OUTPUT_JSON, botiumJsonAsString)
    console.log(`\nCapabilities are written to ${OUTPUT_JSON}`)
  }

  // 6) validating capabilities.
  console.log('\nValidating Capabilities...')
  const connector = new BotiumConnectorGoogleAssistant({ queueBotSays: () => {}, caps })
  try {
    connector.Validate()
    await connector.Build()
    await connector.Start()
    console.log('\nCapabilities are valid')
  } catch (error) {
    console.log(error.toString())
  }
}

_main()
  .catch((err) => console.error(err.toString()))
