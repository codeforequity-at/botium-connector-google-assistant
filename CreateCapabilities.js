#!/usr/bin/env node
const util = require('util')
const jsonutil = require('jsonutil')
const fs = require('fs')
const readlineSync = require('readline-sync')
// const https = require('https')
const { OAuth2Client } = require('google-auth-library')

const BotiumConnectorGoogleAssistant = require('./index').PluginClass

const DEFAULT_GOOGLE_CONFIG = 'googleConfig.json'
const OUTPUT_JSON = 'botium.json'

const _extractArgs = () => {
  const result = {}
  do {
    result.googleConfigPath = readlineSync.question(`Google config path? (${DEFAULT_GOOGLE_CONFIG}) `, {
      defaultInput: DEFAULT_GOOGLE_CONFIG
    })
    try {
      result.googleConfig = jsonutil.readFileSync(result.googleConfigPath)
    } catch (ex) {
      console.log(`Can not load "${result.googleConfigPath}". (${ex})`)
    }
  } while (!result.googleConfig)

  return result
}

const _authorize = (args) => {
  return new Promise((resolve, reject) => {
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

    console.log(`Reading data for project "${args.googleConfig.installed.project_id}"`)

    console.log('Please go to the following link to authorize, then copy the code below')
    // Google OAuth URL to enable the Assistant SDK API for the given client id

    const url = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',

      // If you only need one scope you can pass it as a string
      scope: scopes
    })

    console.log(url)

    const code = readlineSync.question(`Authorization code? `)

    // Use this code to obtain a refresh token
    oauth2Client.getToken(code, (err, tokens) => {
      if (err) {
        return reject(new Error(`Cant authorize. ${util.inspect(err)}`))
      }
      const refreshToken = tokens.refresh_token

      return {code, refreshToken}
    })
  })
}

const _createCapabilities = (args) => {
  return {
    PROJECTNAME: 'Botium Project Google Assistant',
    CONTAINERMODE: 'google-assistant',
    GOOGLE_ASSISTANT_CLIENT_ID: args.googleConfig.installed.client_id,
    GOOGLE_ASSISTANT_CLIENT_SECRET: args.googleConfig.installed.client_secret,
    GOOGLE_ASSISTANT_REFRESH_TOKEN: args.refreshToken,
    GOOGLE_ASSISTANT_TYPE: 'authorized_user'
  }
}

const _main = async () => {
  // 1) does json already exist?
  if (fs.existsSync(OUTPUT_JSON)) {
    if (readlineSync.question(`File ${OUTPUT_JSON} already exists. Continue? [Y/n] `, {limit: /(y|n|)/}) === 'n') {
      console.log('exiting....')
      return
    }
  }

  // 2) get args from user
  const args = _extractArgs()

  // 3) authorize
  const authResult = _authorize(args)

  // 5) create capabilities.
  let caps = _createCapabilities(args, authResult)
  const asString = JSON.stringify(caps, null, 2)
  console.log(`Botium Capabilities (to use for copy & paste):\n ${asString}`)
  if (!fs.existsSync(OUTPUT_JSON) || readlineSync.question(`File ${OUTPUT_JSON} already exists. Overwrite? [y/N] `, {limit: /(y|n|)/}) === 'y') {
    const botiumJsonAsString = JSON.stringify({
      botium: {
        Capabilities: caps

      }
    }, null, 2)
    fs.writeFileSync(OUTPUT_JSON, botiumJsonAsString)
  }

  // 6) validating capabilities.
  console.log(`Validating Capabilities`)
  const connector = new BotiumConnectorGoogleAssistant({queueBotSays: () => {}, caps})
  try {
    connector.Validate()
    console.log(`Capabilities are valid`)
  } catch (error) {
    console.log(error.toString())
  }
}

_main()
  .catch((err) => console.error(err.toString()))
