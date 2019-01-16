// @flow
import React, { Component } from 'react'
import './Finder.css'
import { List } from 'immutable'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { setMessage } from '../actions/editor'
import { hexId, japaneseStringToInternational } from '../utils/format'
import Dialog from '../components/Dialog'

class Finder extends Component {
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
  handleResultClick = (event, id) => {
    const {setMessage, close} = this.props
    event.preventDefault()
    setMessage(id)
    close()
  }
  // We pass on the Enter key to click
  handleResultKeydown = (event, id) => {
    if (event.which === 13) { // Enter
      this.handleResultClick(event, id)
    }
  }
  setInputRef = (ref) => {
    this.input = ref
  }
  renderResult = (message) => {
    const {language} = this.props
    const id = message.get('id')
    return <div key={id} styleName='result' tabIndex='0'
      onClick={(event) => this.handleResultClick(event, id)}
      onKeyDown={(event) => this.handleResultKeydown(event, id)}
    >
      <div styleName='resultHeader'>
        Message {hexId(id)} / {id}
      </div>
      <div styleName='resultContent' dangerouslySetInnerHTML={{__html: message.getIn(['html', language])}} />
    </div>
  }
  render () {
    const {messages, language} = this.props
    const {text} = this.state
    let results = List()
    if (text.length && messages.size) {
      let compareText = japaneseStringToInternational(text).toLowerCase()
      results = messages.filter(message => {
        if (message.get('id') === 0xFFFC) {
          return false
        }
        let plaintext = message.getIn(['plaintext', language])
        return plaintext && plaintext.toLowerCase().indexOf(compareText) >= 0
      }).take(100)
    }
    return (
      <Dialog close={this.props.close}>
        <input styleName='search' type='text' value={text} onChange={this.handleInput} ref={this.setInputRef} placeholder='Search...' />
        <div styleName='results'>
          {results.map(this.renderResult)}
        </div>
      </Dialog>
    )
  }
}

function mapStateToProps (state) {
  return {
    language: state.editor.get('language'),
    messages: state.file.get('messages').shift() // Exclude the special 0 message
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({setMessage}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Finder)
