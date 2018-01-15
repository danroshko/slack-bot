# Slack bot

Wrapper around [node-slack-sdk](https://github.com/slackapi/node-slack-sdk) to make writing
deployment bots a little bit more convenient.

## Installation

```bash
npm i @danroshko/slack-bot
```

## Usage

```javascript
const token = process.env.SLACK_TOKEN;
const Bot = require('slack-bot');
const channel = 'deployments';

const bot = new Bot(token, channel);

bot.on('ping', (message, respond) => {
  respond('pong');
});

bot.on(/^deploy \w+$/, async (message, respond, user, channel) => {
  if (user.is_admin) {
    await doSomething(message.text);
    respond('Done');
  } else {
    respond('Permission denied');
  }
});

bot.onError(err => {
  console.error(err);
});
```
