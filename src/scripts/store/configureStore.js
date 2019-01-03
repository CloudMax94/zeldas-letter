import { createStore, applyMiddleware, compose } from 'redux'
import { createLogger } from 'redux-logger'
import thunk from 'redux-thunk'
import rootReducer from '../reducers'

import * as fileActions from '../actions/file'
import * as editorActions from '../actions/editor'

export function configureStore (initialState) {
  const middleware = []
  const enhancers = []

  // Thunk Middleware
  middleware.push(thunk)

  // Logging Middleware
  const logger = createLogger({
    level: 'info',
    collapsed: true
  })
  middleware.push(logger)

  // Redux DevTools Configuration
  const actionCreators = {
    ...fileActions,
    ...editorActions
  }

  // If Redux DevTools Extension is installed use it, otherwise use Redux compose
  /* eslint-disable no-underscore-dangle */
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      // Options: http://zalmoxisus.github.io/redux-devtools-extension/API/Arguments.html
      actionCreators
    })
    : compose
  /* eslint-enable no-underscore-dangle */

  // Apply Middleware & Compose Enhancers
  enhancers.push(
    applyMiddleware(...middleware)
  )

  const enhancer = composeEnhancers(...enhancers)

  // Create Store
  return createStore(rootReducer, initialState, enhancer)
}
