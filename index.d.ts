import { on } from 'cluster'

export = SlackBot

type ErrorHandler = (err: Error) => void
type ResponseHandler = (ctx: IContext) => void | Promise<void>

declare class SlackBot {
  constructor(token: string, channel: string)

  on(rule: string | RegExp, callback: ResponseHandler): void
  onError(f: ErrorHandler): void

  post(text: string): void
  assert(value: boolean, message: string): void
}

interface IContext {
  message: IMessage
  user: IUser
  channel: IChannel
  respond: (text: string) => void
  assert: (value: boolean, message: string) => void
  match?: string[]
}

interface IMessage {
  type: string
  subtype?: string
  hidden?: boolean
  channel: string
  team: string
  user: string
  text: string
  ts: string
}

interface IUser {
  id: string
  team_id: string
  deleted: boolean
  real_name: string
  profile: {
    real_name: string
    display_name: string
    email: string
  }
  is_admin: boolean
  is_owner: boolean
  is_bot: boolean
}

interface IChannel {
  id: string
  name: string
  members: string[]
}
