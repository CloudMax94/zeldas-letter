// @flow
import React, { Component } from 'react'
import './Goto.css'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { setMessage } from '../actions/editor'
import { hexId } from '../utils/format'

class Goto extends Component {
  constructor (props) {
    super(props)
    this.state = {
      text: ''
    }
  }
  componentDidMount () {
    this.input.focus()
  }
  handleInput = (event) => {
    this.setState({text: event.target.value})
  }
  handleContainerClick = (event) => {
    event.stopPropagation()
  }
  handleResultClick = (event) => {
    const {messages, setMessage, close} = this.props

    event.preventDefault()
    let id = this.state.text
    if (!isNaN(id)) {
      id = parseInt(id)
      if (id === 0) {
        setMessage(id)
      } else {
        let message = messages.find(message =>
          message.get('id') === id
        )
        if (message) {
          setMessage(id)
        }
      }
    }
    close()
  }
  // We pass on the Enter key to click
  handleKeydown = (event) => {
    if (event.which === 13) { // Enter
      this.handleResultClick(event)
    }
  }
  setInputRef = (ref) => {
    this.input = ref
  }
  renderResult = (message) => {
    const {language} = this.props
    const id = message.get('id')
    return <div key={id} styleName='result' tabIndex='0'
      onClick={this.handleResultClick}
      onKeyDown={this.handleKeydown}
    >
      <div styleName='resultHeader'>
        Message {hexId(id)} / {id}
      </div>
      <div styleName='resultContent' dangerouslySetInnerHTML={{__html: message.getIn(['html', language])}} />
    </div>
  }
  render () {
    const {messages} = this.props
    const {text} = this.state
    let message
    if (messages.size && text.length && !isNaN(text)) {
      let id = parseInt(text)
      if (id !== 0xFFFC) {
        message = messages.find(message =>
          message.get('id') === id
        )
      }
    }
    return [
      <div key='container' styleName='container' onClick={this.handleContainerClick}>
        <input styleName='search' type='text' value={text} onChange={this.handleInput} onKeyDown={this.handleKeydown} ref={this.setInputRef} placeholder='Enter a Message ID to go to' />
        <div styleName='results'>
          {message ? this.renderResult(message) : null}
        </div>
      </div>
    ]
  }
}

function mapStateToProps (state) {
  return {
    language: state.editor.get('language'),
    messages: state.file.get('messages')
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({setMessage}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Goto)