// @flow
import React, { Component } from 'react'
import './Changes.css'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { setMessage } from '../actions/editor'
import { hexId } from '../utils/format'

class Changes extends Component {
  handleResultClick = (event, id) => {
    event.preventDefault()
    this.props.setMessage(id)
  }
  // We pass on the Enter key to click
  handleResultKeydown = (event, id) => {
    if (event.which === 13) { // Enter
      this.handleResultClick(event, id)
    }
  }
  renderMessage = (message) => {
    const {language} = this.props
    const id = message.get('id')

    let status = 'MODIFIED'
    if (!message.get('original')) {
      status = 'ADDED'
    }
    if (message.get('deleteState')) {
      status = 'DELETED'
    }

    return <div key={id} styleName='message' tabIndex='0'
      onClick={(event) => this.handleResultClick(event, id)}
      onKeyDown={(event) => this.handleResultKeydown(event, id)}
    >
      <div styleName='messageHeader'>
        Message {hexId(id)} / {id} [{status}]
      </div>
      <div styleName='messageContent' dangerouslySetInnerHTML={{__html: message.getIn(['html', language])}} />
    </div>
  }
  render () {
    const {modifiedMessages} = this.props
    return (
      <div styleName='container'>
        <div styleName='header'>Unsaved changes</div>
        <div styleName='messages'>
          {modifiedMessages.map(this.renderMessage)}
        </div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  let modifiedMessages = state.file.get('messages').shift().filter(message =>
    message.get('deleteState') || !message.get('data').equals(message.get('original'))
  ) // Exclude the special 0 message
  return {
    language: state.editor.get('language'),
    modifiedMessages
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({setMessage}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Changes)
