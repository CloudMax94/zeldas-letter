import * as EDITOR from '../constants/editor'

export function setMessage (id) {
  return {
    type: EDITOR.SET_MESSAGE,
    id
  }
}

export function setLanguage (id) {
  return {
    type: EDITOR.SET_LANGUAGE,
    id
  }
}
