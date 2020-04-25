import React, { Component } from 'react'
import './Commands.css'
import { List, Map } from 'immutable'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { saveFile, saveSourceText, saveBinaries, setMessageDeleteState, undoMessageChanges, removeExtraLanguages } from '../actions/file'
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
          if (this.props.loaded) {
            this.props.saveFile()
          }
        }
      }),
      new Map({
        title: 'Application: Save Source Text',
        action: () => {
          if (this.props.loaded) {
            this.props.saveSourceText()
          }
        }
      }),
      new Map({
        title: 'Application: Save Binaries',
        action: () => {
          if (this.props.loaded) {
            this.props.saveBinaries()
          }
        }
      }),
      new Map({
        title: 'Application: Help (Go to Message 0x0000 / 0)',
        action: () => {
          if (this.props.loaded) {
            this.props.setMessage(0)
          }
        }
      }),
      new Map({
        title: 'Message: Finder',
        accelerator: 'cmdorctrl+F',
        action: () => {
          if (this.props.loaded) {
            this.props.openFinder()
            return false
          }
        }
      }),
      new Map({
        title: 'Message: Go To',
        accelerator: 'cmdorctrl+G',
        action: () => {
          if (this.props.loaded) {
            this.props.openGoto()
            return false
          }
        }
      }),
      new Map({
        title: 'Message: Delete',
        accelerator: 'cmdorctrl+D',
        action: () => {
          if (this.props.loaded) {
            this.props.setMessageDeleteState(true)
          }
        }
      }),
      new Map({
        title: 'Message: Undo Changes',
        accelerator: 'cmdorctrl+R',
        action: () => {
          if (this.props.loaded) {
            this.props.undoMessageChanges()
          }
        }
      }),
      new Map({
        title: 'Interface: Toggle Layout',
        action: () => {
          this.props.toggleHorizontalPreview()
        }
      }),
      new Map({
        title: 'ROM: Remove Extra Languages',
        action: () => {
          if (this.props.loaded) {
            this.props.removeExtraLanguages()
          }
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
    event.preventDefault()
    let action = this.commands.get(id).get('action')
    if (action) {
      // if action returns false, we don't trigger close
      if (action() === false) {
        return
      }
    }
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
  return {
    loaded: !!state.file.get('buffer')
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({saveFile, saveSourceText, saveBinaries, setMessageDeleteState, undoMessageChanges, removeExtraLanguages, setMessage, toggleHorizontalPreview}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Commands)
