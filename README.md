# Botium Connector for Google Assistant

[![NPM](https://nodei.co/npm/botium-connector-google-assistant.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-connector-google-assistant/)

[![Codeship Status for codeforequity-at/botium-connector-google-assistant](https://app.codeship.com/projects/593ff3f0-0215-0137-a1db-3a97ab62e3ba/status?branch=master)](https://app.codeship.com/projects/324985)
[![npm version](https://badge.fury.io/js/botium-connector-google-assistant.svg)](https://badge.fury.io/js/botium-connector-google-assistant)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

This is a [Botium](https://github.com/codeforequity-at/botium-core) connector for testing your Action in Google Assistant.

__Did you read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) articles ? Be warned, without prior knowledge of Botium you won't be able to properly use this library!__

## How it works ?
Botium registers itself with the [Google Assistant SDK](https://developers.google.com/assistant/sdk/overview) as "virtual device" to talk to your Google Action.

**IMPORTANT: The Google Assistant SDK this Botium connector is buildling upon is currently in ALPHA state and not considered to be ready for production use**

It can be used as any other Botium connector with all Botium Stack components:
* [Botium CLI](https://github.com/codeforequity-at/botium-cli/)
* [Botium Bindings](https://github.com/codeforequity-at/botium-bindings/)
* [Botium Box](https://www.botium.at)

## Requirements
* **Node.js and NPM**
* a **Google Action**, and user account with administrative rights
* a **project directory** on your workstation to hold test cases and Botium configuration

## Features
### Requests
* Sending button click event
```
#me
BUTTON yes
```
### [Botium Asserters](https://botium.atlassian.net/wiki/spaces/BOTIUM/pages/2293815/Botium+Asserters) to check response 
* Text asserting
* Button asserting (for [Suggestion Chips](https://developers.google.com/assistant/conversational/responses#suggestion_chips), for [Link Out Suggestion](https://developers.google.com/assistant/conversational/reference/rest/Shared.Types/AppResponse#linkoutsuggestion), and for buttons of complex UI elements)
```
#bot
BUTTONS yes|no|cancel
```
* Media asserting (for [Media Responses](https://developers.google.com/assistant/conversational/responses#media_responses), and for image/media of complex UI elements)
 ```
#bot
MEDIA https://www.botium.at/images/logo.png
```
* SSML asserting
```
#bot
<speak>Hello <break time='300ms'/> World</speak>
```
* Card asserting. For Basic Card, Carousel, Browse Carousel, List, and Table components. With list you can assert title too
 ```
#bot
Title of List
CARDS First|Second
```

* Asserting response containing more UI elements. For example Media Response is not a standalone UI element, works just with Simple Response, and Suggestion Chips.
 They can be asserted together:
 ```
#bot
simple response
MEDIA https://www.botium.at/images/logo.png
BUTTONS button1|button2
```

### Account linking
* You can test your action with non-linked user without any change.
* If you invoke the account linking process with this non-linked user, nothing happens. You got empty message return, and the account wont be linked
* If you perm account linking in Actions console simulator, then you will got a linked user
* Tested just on [Account linking with Google Sign-In](https://developers.google.com/actions/identity/google-sign-in)
* You can see account linking on https://myaccount.google.com/permissions

## Install Botium and Google Assistant Connector

When using __Botium CLI__:

```
> npm install -g botium-cli
> npm install -g botium-connector-google-assistant
> botium-cli init
> botium-cli run
```

When using __Botium Bindings__:

```
> npm install -g botium-bindings
> npm install -g botium-connector-google-assistant
> botium-bindings init mocha
> npm install && npm run mocha
```

When using __Botium Box__:

_Already integrated into Botium Box, no setup required_

## Connecting Google Assistant SDK to Botium

### 1. Prepare googleConfig.json (Google credentials)

* Configure an Actions Console project (See [here](https://developers.google.com/assistant/sdk/guides/service/python/embed/config-dev-project-and-account))
* Register a Device Model (See [here](https://developers.google.com/assistant/sdk/guides/service/python/embed/register-device)) and download the OAuth 2.0 credentials file
    * Rename the file to _googleConfig.json_
    * You can download the credentials [here](https://console.developers.google.com/apis/credentials) as well
    * If you dont see device registrations while configuring your action, then check [this](https://stackoverflow.com/questions/50313261/actions-on-google-not-showing-device-registration-option) or [this](https://github.com/actions-on-google/actions-on-google-testing-nodejs/issues/4)

### 2. Run the "Botium Connector Google Actions Initialization Tool"

The connector repository includes a tool to compose the Botium capabilities (including private keys, access tokens etc). Create a project directory of your choice, and follow the steps below.

There are several ways of running this tool, depending on how you installed it:

When you are using the Botium CLI, then just run
```
> botium-cli init-google-assistant
```

When you installed the NPM package for this repository, then run
```
> npx botium-connector-google-assistant-init
```

When you cloned or downloaded this repository, and you are in the _samples/convo_ folder, then run
```
> npm run init-google
or
> npx botium-connector-google-assistant-init
```

Follow the suggested steps:
* you will be asked for location of the downloaded credential file
* you will be presented a hyperlink you have to open in your browser to connect your Action to your Google account. (You have to use the same Google account as for developing the action if action is not published yet. OTHERWISE YOU GOT ALWAYS EMPTY RESPONSE, WITHOUT ERROR MESSAGE)
* you will be asked for start utterance, which activates your action. It is the same what you can see on Actions console simulator (_https://console.actions.google.com/project/YOURPROJECTID/simulator_) IF THIS VALUE IS NOT CORRECT, YOU GOT ALWAYS EMPTY RESPONSE, WITHOUT ERROR MESSAGE.
* and stop utterance, which deactivates your action.

### 3. Use the generated botium.json
A file named botium.json is generated containing the required capabilities to be used with Botium.

To check the configuration, run the emulator (Botium CLI required) to bring up a chat interface in your terminal window:

```
> botium-cli emulator
```

Botium setup is ready, you can begin to write your [BotiumScript](https://github.com/codeforequity-at/botium-core/wiki/Botium-Scripting) files.

## How to start sample

There is a small tech demo in [samples/convo](./samples/convo) with Botium Bindings. You can see there how to deal with different UI elements.

Before start create botium.json, and use [this](./samples/convo/connectortesttarget.zip) as Dialogflow project.

Start the test with:

    > npm install
    > npm test

## Setting Location for Test Cases

Either set global with capabilities _GOOGLE_ASSISTANT_LOCATION_LATITUDE_ and _GOOGLE_ASSISTANT_LOCATION_LONGITUDE_ (see below).

Or with the _UPDATE_CUSTOM_ logic hook in BotiumScript:


```
location

#begin
UPDATE_CUSTOM LOCATION|LATITUDE|48.210033
UPDATE_CUSTOM LOCATION|LONGITUDE|16.363449

#me
hi

#bot
...
```

Or for individual conversation steps (if this makes sense at all to switch location within a conversation ...):

```
location

#me
hi
UPDATE_CUSTOM LOCATION|LATITUDE|48.210033
UPDATE_CUSTOM LOCATION|LONGITUDE|16.363449

#bot
...
```

## Supported Capabilities

Set the capability __CONTAINERMODE__ to __google-assistant__ to activate this connector.

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

### GOOGLE_ASSISTANT_LOCATION_LATITUDE
Location latitude

### GOOGLE_ASSISTANT_LOCATION_LONGITUDE
Location longitude
