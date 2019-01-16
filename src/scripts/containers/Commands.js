import React, { Component } from 'react'
import './Commands.css'
import { List, Map } from 'immutable'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { saveFile } from '../actions/file'
import { setMessage } from '../actions/editor'
import { toggleHorizontalPreview } from '../actions/settings'

import Dialog from '../components/Dialog'

let cmdorctrlString = 'Ctrl'
if (navigator.platform.indexOf('Mac') > -1) {
  cmdorctrlString = '⌘'
}

class Commands extends Component {
  constructor (props) {
    super(props)

    this.commands = List([
      new Map({
        title: 'Application: Open ROM',
        accelerator: 'cmdorctrl+O',
        action: () => {
          this.props.showFileOpener()
        }
      }),
      new Map({
        title: 'Application: Save ROM',
        accelerator: 'cmdorctrl+S',
        action: () => {
          this.props.saveFile()
        }
      }),
      new Map({
        title: 'Application: Help (Go to Message 0x0000 / 0)',
        action: () => {
          this.props.setMessage(0)
        }
      }),
      new Map({
        title: 'Message: Finder',
        accelerator: 'cmdorctrl+F',
        action: () => {
        }
      }),
      new Map({
        title: 'Message: Go To',
        accelerator: 'cmdorctrl+G',
        action: () => {
        }
      }),
      new Map({
        title: 'Interface: Toggle Layout',
        action: () => {
          this.props.toggleHorizontalPreview()
        }
      })
    ])

    this.state = {
      activeItem: 0
    }
  }
  componentDidMount () {
    document.addEventListener('keydown', this.handleKeydown)
  }
  componentWillUnmount () {
    document.removeEventListener('keydown', this.handleKeydown)
  }
  handleContainerClick = (event) => {
    event.stopPropagation()
  }
  handleCommandClick = (event, id) => {
    const {close} = this.props
    if (this.commands.get(id).has('action')) {
      this.commands.getIn([id, 'action'])()
    }
    event.preventDefault()
    close()
  }
  handleKeydown = (event) => {
    switch (event.which) {
      case 38: // Up Arrow
        this.setState((state, props) => ({
          activeItem: (state.activeItem || this.commands.size) - 1
        }))
        break
      case 40: // Down Arrow
        this.setState((state, props) => ({
          activeItem: (state.activeItem + 1) % this.commands.size
        }))
        break
      case 13: // Enter
        this.handleCommandClick(event, this.state.activeItem)
        break
    }
  }
  renderCommand = (command, i) => {
    const {activeItem} = this.state
    const accelerator = command.get('accelerator')
    return <div key={i} styleName={activeItem === i ? 'command--active' : 'command'}
      onClick={(event) => this.handleCommandClick(event, i)}
    >
      {command.get('title')}
      {
        accelerator
          ? <span styleName='accelerator'>{command.get('accelerator').replace(/cmdorctrl/g, cmdorctrlString)}</span>
          : null
      }
    </div>
  }
  render () {
    return (
      <Dialog close={this.props.close}>
        <div styleName='commands'>
          {this.commands.map(this.renderCommand)}
        </div>
      </Dialog>
    )
  }
}

function mapStateToProps (state) {
  return {}
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({saveFile, setMessage, toggleHorizontalPreview}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Commands)
