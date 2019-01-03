import React from 'react'
import { render } from 'react-dom'
import { persistStore } from 'redux-persist'
import { configureStore } from './store/configureStore'
import Root from './containers/Root'
import '../style/global.css'

const store = configureStore()

persistStore(store, null, () => {
  render(
    <Root store={store} />,
    document.getElementById('react-container')
  )
})
