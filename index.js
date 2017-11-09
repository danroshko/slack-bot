const { WebClient, RtmClient, RTM_EVENTS } = require('@slack/client')
const debug = require('debug')('slack-bot')

class Bot {
  constructor (token, channel) {
    this._token = token
    this._channel = channel
    this._slackUsers = {}
    this._slackChannels = {}

    this._rtm = new RtmClient(token)
    this._web = new WebClient(token)

    this._handlers = []

    this._getSlackUsers()
    this._getSlackChannels()
    this._start()
  }

  /* public interface */

  on (rule, callback) {
    this._handlers.push({ rule, callback })
  }

  onError (func) {
    this._errorHandler = func
  }

  post (text, channel = this._channel) {
    const options = { as_user: true }
    const channelId = this._slackChannels[channel]

    this._web.chat.postMessage(channelId, text, options, err => {
      if (err) this._errorHandler(err)
    })
  }

  /* private methods */

  _errorHandler (error) {
    throw error
  }

  _getSlackUsers () {
    this._web.users.list((err, data) => {
      if (err) return this._errorHandler(err)

      debug('Fetched list of users: %O', data)

      data.members.forEach(user => {
        if (!user.is_bot) {
          this._slackUsers[user.id] = user
        }
      })
    })
  }

  _getSlackChannels () {
    this._web.channels.list((err, data) => {
      if (err) return this._errorHandler(err)

      debug('Fetched list of channels: %O', data)

      data.channels.forEach(channel => {
        this._slackChannels[channel.name] = channel.id
      })
    })
  }

  _start () {
    this._rtm.start()

    this._rtm.on(RTM_EVENTS.MESSAGE, message => {
      debug('Message: %O', message)
      this._handleMessage(message).catch(this._errorHandler)
    })
  }

  async _handleMessage (message) {
    const isUser = this._slackUsers[message.user] != null
    const anotherChannel =
      message.channel !== this._slackChannels[this._channel]

    if (!isUser) return
    if (message.hidden) return
    if (anotherChannel) return

    const { text } = message
    const respond = (text, channel) => {
      this.post(text, channel)
    }

    for (const { rule, callback } of this._handlers) {
      if (typeof rule === 'string' && text === rule) {
        return callback(message, respond)
      }

      if (rule instanceof RegExp && rule.test(text)) {
        return callback(message, respond)
      }
    }
  }
}

module.exports = Bot
