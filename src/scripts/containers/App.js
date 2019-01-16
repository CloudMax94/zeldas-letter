// @flow
import React, { Component } from 'react'
import './App.css'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { setFile, saveFile } from '../actions/file'

import Landing from '../components/Landing'
import Editor from './Editor'
import Changes from './Changes'
import Finder from './Finder'
import Goto from './Goto'
import Commands from './Commands'

const DIALOG_NONE = false
const DIALOG_FINDER = 1
const DIALOG_GOTO = 2
const DIALOG_COMMANDS = 3

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dialog: DIALOG_NONE
    }
  }

  componentWillMount () {
    document.addEventListener('keydown', this.handleKeydown)
  }

  componentWillUnmount () {
    document.removeEventListener('keydown', this.handleKeydown)
  }

  openDialog = (dialog) => {
    if (!this.storedFocus) {
      this.storedFocus = document.activeElement
    }
    this.setState({dialog})
  }

  openFinder = () => {
    this.openDialog(DIALOG_FINDER)
  }

  openGoto = () => {
    this.openDialog(DIALOG_GOTO)
  }

  openCommands = () => {
    this.openDialog(DIALOG_COMMANDS)
  }

  closeDialog = () => {
    if (this.storedFocus) {
      this.storedFocus.focus()
      this.storedFocus = false
    }
    this.setState({
      dialog: DIALOG_NONE
    })
  }

  showFileOpener = () => {
    this.fileOpener.click()
  }

  handleKeydown = (event) => {
    const {loaded} = this.props
    let cmdorctrlKey = event.metaKey || event.ctrlKey
    if (event.which === 27) {
      event.preventDefault()
      this.closeDialog()
    } else if (cmdorctrlKey && event.which === 70) {
      event.preventDefault()
      if (this.state.dialog !== DIALOG_FINDER) {
        this.openFinder()
      } else {
        this.closeDialog()
      }
    } else if (cmdorctrlKey && event.which === 71) {
      event.preventDefault()
      if (this.state.dialog !== DIALOG_GOTO) {
        this.openGoto()
      } else {
        this.closeDialog()
      }
    } else if (cmdorctrlKey && event.which === 80) {
      event.preventDefault()
      if (this.state.dialog !== DIALOG_COMMANDS) {
        this.openCommands()
      } else {
        this.closeDialog()
      }
    } else if (cmdorctrlKey && event.which === 83) {
      event.preventDefault()
      if (loaded) {
        this.props.saveFile()
      }
    } else if (cmdorctrlKey && event.which === 79) {
      event.preventDefault()
      this.showFileOpener()
    }
  }

  handleClick = (event) => {
    if (this.state.dialog !== DIALOG_NONE) {
      this.closeDialog()
    }
  }

  handleDragOver = (event) => {
    if (event.dataTransfer.types.indexOf('Files') >= 0) {
      event.preventDefault()
    }
  }

  loadFile = (file) => {
    if (!(file instanceof Blob)) {
      return
    }
    const reader = new FileReader()
    reader.onloadend = (e) => {
      let buffer = Buffer.from(e.target.result)
      let name = file.name
      this.props.setFile(buffer, name)
    }
    reader.readAsArrayBuffer(file)
  }

  handleDrop = (event) => {
    this.loadFile(event.dataTransfer.files[0])
    event.preventDefault()
  }

  handleFileOpener = (event) => {
    this.loadFile(this.fileOpener.files[0])
  }

  setFileOpenerRef = (ref) => {
    this.fileOpener = ref
  }

  render () {
    const {loaded} = this.props
    const {dialog} = this.state
    return (
      <div onDrop={this.handleDrop} onDragOver={this.handleDragOver} onClick={this.handleClick} styleName='container'>
        <input type='file' ref={this.setFileOpenerRef} onChange={this.handleFileOpener} style={{display: 'none'}} />
        {
          dialog === DIALOG_FINDER ? <Finder close={this.closeDialog} />
            : dialog === DIALOG_GOTO ? <Goto close={this.closeDialog} />
              : dialog === DIALOG_COMMANDS ? <Commands close={this.closeDialog} showFileOpener={this.showFileOpener} />
                : null
        }
        {loaded ? [<Editor key='editor' />, <Changes key='changes' />] : <Landing />}
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    loaded: !!state.file.get('buffer')
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({setFile, saveFile}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
