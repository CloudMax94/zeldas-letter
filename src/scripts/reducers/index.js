// @flow
import { createTransform, persistCombineReducers } from 'redux-persist'
import { Map } from 'immutable'
import storage from 'redux-persist/lib/storage' // or whatever storage you are using
import file from './file'
import editor from './editor'
import settings from './settings'

// HACK: redux-persist v5 can not deal with immutable stores by default
//       https://github.com/rt2zz/redux-persist/issues/520
const immutableReconciler = (inboundState, originalState, reducedState) => {
  const newState = { ...reducedState }
  inboundState = inboundState || {}
  Object.keys(reducedState).forEach(reducerKey => {
    if (reducerKey === '_persist' || originalState[reducerKey] !== reducedState[reducerKey]) {
      return
    }
    newState[reducerKey] = Map.isMap(newState[reducerKey])
      ? newState[reducerKey].merge(inboundState[reducerKey])
      : { ...newState[reducerKey], ...inboundState[reducerKey] }
  })
  return newState
}

const settingsTransform = createTransform(
  (inboundState, key) => {
    return inboundState
  },
  (outboundState, key) => {
    return outboundState
  },
  {whitelist: ['settings']}
)

const storeConfig = {
  key: 'mudora',
  storage,
  whitelist: ['settings'],
  transforms: [settingsTransform],
  stateReconciler: immutableReconciler
}

const rootReducer = persistCombineReducers(storeConfig, {
  file,
  editor,
  settings
})

export default rootReducer
