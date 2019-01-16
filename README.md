# Botium Connector for Amazon Alexa with AVS

[![NPM](https://nodei.co/npm/botium-connector-alexa-avs.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-connector-google-assistant/)

[ ![Codeship Status for codeforequity-at/botium-connector-google-assistant](https://app.codeship.com/projects/f379ece0-ee76-0136-6e85-5afc45d94643/status?branch=master)](https://app.codeship.com/projects/320125)
[![npm version](https://badge.fury.io/js/botium-connector-google-assistant.svg)](https://badge.fury.io/js/botium-connector-google-assistant)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

This is a [Botium](https://github.com/codeforequity-at/botium-core) connector for testing your Action in Google Assistant.

__Did you read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) articles ? Be warned, without prior knowledge of Botium you won't be able to properly use this library!__

## How it works ?
The steps to run a conversation with Google Actions are:

* Configure your action (See steps 1-6 in https://developers.google.com/assistant/sdk/guides/service/python/embed/config-dev-project-and-account)
* If you dont see device registrations while configuring your action, then check 
https://stackoverflow.com/questions/50313261/actions-on-google-not-showing-device-registration-option or 
https://github.com/actions-on-google/actions-on-google-testing-nodejs/issues/4
* Download credentials
* Prepare Botium Capabilities

It can be used as any other Botium connector with all Botium Stack components:
* [Botium CLI](https://github.com/codeforequity-at/botium-cli/)
* [Botium Bindings](https://github.com/codeforequity-at/botium-bindings/)
* [Botium Box](https://www.botium.at)

## Preparing Botium Capabilities

The connector repository includes a tool to compose the Botium capabilities (including private keys, access tokens etc). Create a project directory of your choice, and follow the steps below.

### 1. Run the "Botium Connector Google Actions Initialization Tool"

There are several ways of running this tool, depending on how you installed it:

When you are using the Botium CLI, then just run
```
> botium-cli init-google-assistant
```

When you installed the NPM package for this repository, then run
```
> botium-connector-google-actions-init
```

When you cloned or downloaded this repository, and you are in the "samples" folder, then run
```
> npm run init-google-actions
or
> ./node_modules/.bin/botium-connector-google-actions-init
```

Just follow the suggested steps, 
* you will be asked for location of the downloaded credential file
* you will be presented a hyperlink you have to open in your browser to connect your Action to your Google account. (You have to use the same Google account as for developing the action if action is not published yet. OTHERWISE YOU GOT ALWAYS EMPTY RESPONSE, WITHOUT ERROR MESSAGE)
* you will be asked for start utterance, which activates your action. It is the same what you can see on Actions console simulator (https://console.actions.google.com/project/-your project id->/simulator) IF THIS VALUE IS NOT CORRECT, YOU GOT ALWAYS EMPTY RESPONSE, WITHOUT ERROR MESSAGE.
* and stop utterance, which deactivates your action.

### 2. Use the generated botium.json
A file named botium.json is generated containing the required capabilities to be used with Botium.
TODO!!! The sample botiumFluent.js in the "samples" folder asks Alexa for washing powder (in german language).

## Supported Capabilities

Set the capability __CONTAINERMODE__ to __google-actions__ to activate this connector.

### GOOGLE_ASSISTANT_CLIENT_ID
See downloaded credential file

### GOOGLE_ASSISTANT_CLIENT_SECRET
See downloaded credential file

### GOOGLE_ASSISTANT_REFRESH_TOKEN
The simpliest way to acquire it, is the initialization tool described above

### GOOGLE_ASSISTANT_TYPE
Set it to "authorized_user"

### GOOGLE_ASSISTANT_START_UTTERANCE
It is "Talk to my test app" if the name of your app is "my test app", which is the default value.

### GOOGLE_ASSISTANT_END_UTTERANCE
Use "Cancel"

## Account linking
* You can test your action with non-linked user without any change.
* If you invoke the account linking process with this non-linked user, nothing happens. You got empty message return, and the account wont be linked
* If you perm account linking in Actions console simulator, then you will got a linked user
* You can see account linking on https://myaccount.google.com/permissions
