import { Map, List } from 'immutable'
import * as FILE from '../constants/file'

export default function file (state: Map<string, Object> = Map({
  buffer: null,
  name: null,
  messages: List(),
  languages: List()
}), action: Object) {
  let index
  switch (action.type) {
    case FILE.SET_FILE:
      return state
        .set('buffer', action.buffer)
        .set('name', action.name)
        .set('messages', action.messages)
        .set('languages', action.languages)
    case FILE.SET_LANGUAGES:
      return state.set('languages', action.languages)
    case FILE.SET_MESSAGES:
      return state.set('messages', action.messages)
    case FILE.FILE_SAVED:
      return state.update('messages', (messages) => {
        return messages
          .filter((message) => {
            return !message.get('deleteState')
          })
          .map((message) => {
            return message.set('original', message.get('data'))
          })
      })
    case FILE.SET_MESSAGE_TYPE:
      index = state.get('messages').findIndex((message) => message.get('id') === action.id)
      if (index < 0) {
        console.warn(`Could not set type for message ${action.id}; Message does not exist`)
        return state
      }
      return state
        .setIn(['messages', index, 'data', 'type'], action.value)
        .setIn(['messages', index, 'deleteState'], false)
    case FILE.SET_MESSAGE_POSITION:
      index = state.get('messages').findIndex((message) => message.get('id') === action.id)
      if (index < 0) {
        console.warn(`Could not set position for message ${action.id}; Message does not exist`)
        return state
      }
      return state
        .setIn(['messages', index, 'data', 'position'], action.value)
        .setIn(['messages', index, 'deleteState'], false)
    case FILE.SET_MESSAGE_TEXT:
      index = state.get('messages').findIndex((message) => message.get('id') === action.id)
      if (index < 0) {
        console.warn(`Could not set text for message ${action.id}; Message does not exist`)
        return state
      }
      return state
        .setIn(['messages', index, 'data', 'text', action.language], action.text)
        .setIn(['messages', index, 'html', action.language], action.html)
        .setIn(['messages', index, 'plaintext', action.language], action.plaintext)
        .setIn(['messages', index, 'deleteState'], false)
    case FILE.UNDO_MESSAGE_CHANGES:
      index = state.get('messages').findIndex((message) => message.get('id') === action.id)
      if (index < 0) {
        console.warn(`Could not undo changes for message ${action.id}; Message does not exist`)
        return state
      }
      if (!state.getIn(['messages', index, 'original'])) {
        // The message does not have an original state, so we can't undo anything
        return state.setIn(['messages', index, 'deleteState'], false)
      }
      return state
        .setIn(['messages', index, 'data'], state.getIn(['messages', index, 'original']))
        .setIn(['messages', index, 'deleteState'], false)
    case FILE.SET_MESSAGE_DELETE_STATE:
      index = state.get('messages').findIndex((message) => message.get('id') === action.id)
      if (index <= 0) {
        console.warn(`Could not set delete state for message ${action.id}; Message does not exist`)
        return state
      }
      return state.setIn(['messages', index, 'deleteState'], action.state)
    default:
      return state
  }
}
