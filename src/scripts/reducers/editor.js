import { Map } from 'immutable'
import * as EDITOR from '../constants/editor'

export default function file (state: Map<string, Object> = Map({
  message: 0,
  language: 0
}), action: Object) {
  switch (action.type) {
    case EDITOR.SET_LANGUAGE:
      return state.set('language', action.id)
    case EDITOR.SET_MESSAGE:
      return state.set('message', action.id)
    default:
      return state
  }
}
