// @flow
import React, { Component } from 'react'
import './Editor.css'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Parser from '../utils/parser'
import { hexId } from '../utils/format'
import { setMessage, setLanguage } from '../actions/editor'
import { setMessageType, setMessagePosition, setMessageText } from '../actions/file'

import {Controlled as CodeMirror} from 'react-codemirror2'
import '../utils/codemirror-mode'
import 'codemirror/addon/selection/active-line'

class Editor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      renders: []
    }
    this.updateRender(props.message.get('data'))
    this.isRendering = false
  }
  componentWillUpdate (nextProps, nextState) {
    let diffLang = this.props.language !== nextProps.language
    if (diffLang || !this.props.message.get('data').equals(nextProps.message.get('data'))) {
      this.updateRender(nextProps.message.get('data'), nextProps.language)
    }
  }
  async updateRender (messageData, language = this.props.language) {
    if (this.isRendering) {
      this.queuedRender = true
      return
    }
    this.isRendering = true
    let isJapanese = this.props.languages.get(language) === 'Japanese'
    let buffer = messageData.getIn(['buffer', language])
    let renders = await Parser.renderMessage(
      buffer,
      messageData.get('type'),
      messageData.get('position'),
      isJapanese
    )
    this.setState({
      renders
    })
    this.isRendering = false
    if (this.queuedRender) {
      this.queuedRender = false
      this.updateRender(this.props.message.get('data'))
    }
  }
  handleLanguage = (event) => {
    this.props.setLanguage(parseInt(event.target.value))
  }
  handleType = (event) => {
    this.props.setMessageType(this.props.id, parseInt(event.target.value))
  }
  handlePosition = (event) => {
    this.props.setMessagePosition(this.props.id, parseInt(event.target.value))
  }
  handleInput = (event) => {
    this.props.setMessageText(this.props.id, event.target.value, this.props.language)
  }
  handleAceInput = (newValue) => {
    this.props.setMessageText(this.props.id, newValue, this.props.language)
  }
  handleCodeMirrorInput = (editor, data, value) => {
    this.props.setMessageText(this.props.id, value, this.props.language)
  }
  render () {
    const {renders} = this.state
    const {horizontalPreview, message, language, languages} = this.props
    const data = message.get('data')
    const id = message.get('id')
    const text = data.getIn(['text', language])
    return (
      <div styleName={horizontalPreview ? 'container--horizontal' : 'container'}>
        <div styleName='workspace'>
          <div styleName='header'>Message: {hexId(id)} / {id}</div>
          <div styleName='settings'>
            <select styleName='select' onChange={this.handleLanguage} value={language}>
              {languages.map((laungage, i) =>
                <option key={i} value={i}>{laungage}</option>
              )}
            </select>
            <select styleName='select' onChange={this.handleType} value={data.get('type')}>
              <optgroup label='Valid'>
                <option value={0}>Black</option>
                <option value={1}>Wooden</option>
                <option value={2}>Blue</option>
                <option value={3}>Ocarina</option>
                <option value={4}>Monologue White (Ignores position, no vertical centering)</option>
                <option value={5}>Monologue Black (No text shadow)</option>
              </optgroup>
              <optgroup label='Invalid (May cause side effects)'>
                <option value={6}>Invalid 0x6</option>
                <option value={7}>Invalid 0x7</option>
                <option value={8}>Invalid 0x8</option>
                <option value={9}>Invalid 0x9</option>
                <option value={10}>Invalid 0xA</option>
                <option value={11}>Invalid 0xB</option>
                <option value={12}>Invalid 0xC</option>
                <option value={13}>Invalid 0xD</option>
                <option value={14}>Invalid 0xE</option>
                <option value={15}>Invalid 0xF</option>
              </optgroup>
            </select>
            <select styleName='select' onChange={this.handlePosition} value={data.get('position')}>
              <optgroup label='Valid'>
                <option value={0}>Automatic</option>
                <option value={1}>Top</option>
                <option value={2}>Center</option>
                <option value={3}>Bottom</option>
              </optgroup>
              <optgroup label='Invalid (These all default to Automatic)'>
                <option value={4}>Invalid 0x4</option>
                <option value={5}>Invalid 0x5</option>
                <option value={6}>Invalid 0x6</option>
                <option value={7}>Invalid 0x7</option>
                <option value={8}>Invalid 0x8</option>
                <option value={9}>Invalid 0x9</option>
                <option value={10}>Invalid 0xA</option>
                <option value={11}>Invalid 0xB</option>
                <option value={12}>Invalid 0xC</option>
                <option value={13}>Invalid 0xD</option>
                <option value={14}>Invalid 0xE</option>
                <option value={15}>Invalid 0xF</option>
              </optgroup>
            </select>
          </div>
          <CodeMirror
            styleName='editor'
            value={text}
            options={{
              mode: 'mudora',
              lineNumbers: true,
              lineWrapping: true,
              styleActiveLine: true,
              extraKeys: {
                Tab: false,
                'Shift-Tab': false,
                'Ctrl-D': false
              },
              theme: 'monokai'
            }}
            onBeforeChange={this.handleCodeMirrorInput}
            onChange={(editor, data, value) => {
              console.log(value)
            }}
          />
        </div>
        <div styleName='preview'>
          {renders.map((render, index) => {
            if (typeof render === 'number') {
              return <div key='continue' styleName='previewContinue' onClick={(e) => this.props.setMessage(render)}>Continues at message {hexId(render)} / {render}</div>
            }
            return <img key={index} src={render} />
          })}
        </div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  let currentId = state.editor.get('message')
  let currentMessage = state.file.get('messages').find(message =>
    message.get('id') === currentId
  )
  if (!currentMessage) {
    currentId = 0
    currentMessage = state.file.getIn(['messages', 0])
  }
  return {
    horizontalPreview: state.settings.get('horizontalPreview'),
    language: state.editor.get('language'),
    languages: state.file.get('languages'),
    message: currentMessage,
    id: currentId
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    setLanguage,
    setMessage,
    setMessageType,
    setMessagePosition,
    setMessageText
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Editor)
