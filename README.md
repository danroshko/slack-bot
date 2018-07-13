# Slack bot

Slack client library built on top of [node-slack-sdk](https://github.com/slackapi/node-slack-sdk).
Provides more high-level interface for building bots with request-reply flow.

## Installation

```bash
npm i @danroshko/slack-bot
```

## Usage

```javascript
const token = process.env.SLACK_TOKEN
const Bot = require('slack-bot')
const channel = 'deployments'

const bot = new Bot(token, channel)

bot.on('ping', ctx => {
  ctx.respond('pong')
})

bot.on(/^deploy \w+$/, async ctx => {
  const { user, message } = ctx
  ctx.assert(user.is_admin, 'Permission denied')

  ctx.respond('Doing something...')
  await doSomething(ctx.message.text)
  ctx.respond('Done')
})

bot.onError(err => {
  console.error(err)
})
```

## Context

* `ctx.message` - [message event](https://api.slack.com/events/message)
* `ctx.user` - [user object](https://api.slack.com/types/user)
* `ctx.channel` - limited [channel object](https://api.slack.com/types/channel)
* `ctx.respond` - function to send back a response
* `ctx.assert` - sends back an error message if assertion fails
* `ctx.match` - match object
