// @flow
import React, { Component } from 'react'
import './Dialog.css'

class Dialog extends Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }
  componentDidMount () {
    this.container.addEventListener('focusout', this.handleFocusOut)
    this.container.children[1].focus()
    for (let closer of [this.container.firstChild, this.container.lastChild]) {
      closer.addEventListener('focus', this.handleFocus)
    }
  }
  componentWillUnmount () {
    this.container.removeEventListener('focusout', this.handleFocusOut)
    for (let closer of [this.container.firstChild, this.container.lastChild]) {
      closer.removeEventListener('focus', this.handleFocus)
    }
  }
  handleFocus = (event) => {
    const {close} = this.props
    close()
  }
  handleFocusOut = (event) => {
    const {close} = this.props
    if (!this.container.contains(event.relatedTarget)) {
      close()
    }
  }
  handleContainerClick = (event) => {
    event.stopPropagation()
  }
  setContainerRef = (ref) => {
    this.container = ref
  }
  render () {
    return [
      <div key='container' styleName='container' ref={this.setContainerRef} onClick={this.handleContainerClick}>
        <div tabIndex='0' />
        <div tabIndex='0' styleName='target'>
          {this.props.children}
        </div>
        <div tabIndex='0' />
      </div>,
      <div key='backdrop' styleName='backdrop' />
    ]
  }
}

export default Dialog
