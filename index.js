const { WebClient, RtmClient, RTM_EVENTS } = require('@slack/client')
const debug = require('debug')('slack-bot')

class Bot {
  constructor (token, channel) {
    this._token = token
    this._channel = channel
    this._slackUsers = []
    this._slackChannels = []

    this._rtm = new RtmClient(token, { dataStore: false, useRtmConnect: true })
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

  post (text) {
    const options = { as_user: true }
    const channel = this._slackChannels.find(ch => {
      return ch.name === this._channel
    })

    this._web.chat.postMessage(channel.id, text, options).catch(err => {
      return this._errorHandler(err)
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
      this._slackUsers = data.members
    })
  }

  _getSlackChannels () {
    this._web.channels.list((err, data) => {
      if (err) return this._errorHandler(err)

      debug('Fetched list of channels: %O', data)
      this._slackChannels = data.channels
    })
  }

  _start () {
    this._rtm.start()

    this._rtm.on(RTM_EVENTS.MESSAGE, message => {
      debug('Message: %O', message)
      this._handleMessage(message).catch(this._errorHandler)
    })

    this._rtm.on(RTM_EVENTS.TEAM_JOIN, () => {
      this._getSlackUsers()
    })
  }

  async _handleMessage (message) {
    const user = this._slackUsers.find(user => user.id === message.user)
    const channel = this._slackChannels.find(ch => ch.id === message.channel)

    if (message.hidden) return
    if (!user || user.is_bot) return
    if (!channel || channel.name !== this._channel) return

    const { text } = message

    for (const { rule, callback } of this._handlers) {
      if (typeof rule === 'string' && text === rule) {
        const ctx = this.createContext(message, user, channel, [text])
        return callback(ctx)
      }

      if (rule instanceof RegExp && rule.test(text)) {
        const ctx = this.createContext(message, user, channel, text.match(rule))
        return callback(ctx)
      }
    }
  }

  createContext (message, user, channel, match) {
    const respond = text => this.post(text)
    const assert = (value, msg) => this.assert(value, msg)

    return { message, user, channel, match, respond, assert }
  }

  assert (value, message) {
    if (!value) {
      this.post(message)
      throw new Error(message)
    }
  }
}

module.exports = Bot
