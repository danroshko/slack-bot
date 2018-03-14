const { WebClient, RTMClient } = require('@slack/client')
const debug = require('debug')('slack-bot')

class Bot {
  constructor (token, channel) {
    this._token = token
    this._channel = channel
    this._slackUsers = []
    this._slackChannels = []

    this._rtm = new RTMClient(token, { useRtmConnect: true })
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
    const channel = this._slackChannels.find(ch => ch.name === this._channel)
    const message = { channel: channel.id, text }

    this._web.chat.postMessage(message).catch(err => {
      return this._errorHandler(err)
    })
  }

  /* private methods */

  _errorHandler (error) {
    throw error
  }

  _getSlackUsers () {
    this._web.users
      .list()
      .then(data => {
        debug('Fetched list of users: %O', data)
        this._slackUsers = data.members
      })
      .catch(err => {
        return this._errorHandler(err)
      })
  }

  _getSlackChannels () {
    this._web.channels
      .list()
      .then(data => {
        debug('Fetched list of channels: %O', data)
        this._slackChannels = data.channels
      })
      .catch(err => {
        return this._errorHandler(err)
      })
  }

  _start () {
    this._rtm.start(null)

    this._rtm.on('message', message => {
      debug('Message: %O', message)
      this._handleMessage(message).catch(this._errorHandler)
    })

    this._rtm.on('team_join', () => {
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
