# Slack bot

Small wrapper around [node-slack-sdk](https://github.com/slackapi/node-slack-sdk) to make writing
deployment bots a little bit more convenient.

## Example

```javascript
const token = process.env.SLACK_TOKEN
const Bot = require('slack-bot')
const channel = 'deployments'

const bot = new Bot(token, channel)

bot.on('ping', (message, respond) => {
  respond('pong')
})

bot.on(/^deploy \w+$/, async (message, respond) => {
  await doSomething(message.text)
  respond('Done')
})

bot.onError(err => {
  console.error(err)
})
```