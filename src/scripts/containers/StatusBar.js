import React, { Component } from 'react'
import './StatusBar.css'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

class StatusBar extends Component {
  render () {
    return (
      <div styleName='container'>
        {this.props.languages.map((language, i) => {
          return <div styleName='lang' key={i}>{language}: {`0x${this.props.bytes[i].toString(16).toUpperCase()}`} bytes</div>
        })}
        <div styleName='count'>{this.props.messageCount} messages</div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  let languages = state.file.get('languages')
  let messages = state.file.get('messages').shift().filter((message) => {
    return !message.get('deleteState')
  })
  let bytes = []
  for (let message of messages) {
    let buffers = message.getIn(['data', 'buffer'])
    for (let i = 0; i < buffers.size && i < languages.size; i++) {
      if (!bytes[i]) {
        bytes[i] = 0
      }
      bytes[i] += (buffers.get(i) || []).length
    }
  }
  return {
    bytes,
    messageCount: messages.size,
    languages
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(StatusBar)
