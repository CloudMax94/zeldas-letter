import { Map } from 'immutable'
import { REHYDRATE } from 'redux-persist'
import * as SETTINGS from '../constants/settings'

export default function settings (state = Map({
  horizontalPreview: 0
}), action) {
  switch (action.type) {
    case REHYDRATE:
      if (action.payload && action.payload.settings) {
        return state.merge(action.payload.settings)
      }
      return state
    case SETTINGS.TOGGLE_HORIZONTAL_PREVIEW:
      return state.set('horizontalPreview', !state.get('horizontalPreview'))
    default:
      return state
  }
}
