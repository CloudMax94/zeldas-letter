// @flow
import React, { Component } from 'react'
import './App.css'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { setFile, loadSource, saveFile, setMessageDeleteState, undoMessageChanges } from '../actions/file'
import path from 'path'

import Landing from '../components/Landing'
import Editor from './Editor'
import Changes from './Changes'
import Finder from './Finder'
import StatusBar from './StatusBar'
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
    if (!this.props.loaded) {
      this.closeDialog()
      return
    }
    this.openDialog(DIALOG_FINDER)
  }

  openGoto = () => {
    if (!this.props.loaded) {
      this.closeDialog()
      return
    }
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
    } else if (cmdorctrlKey && event.which === 68) {
      event.preventDefault()
      if (loaded) {
        this.props.setMessageDeleteState(true)
      }
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
    } else if (cmdorctrlKey && event.which === 79) {
      event.preventDefault()
      this.showFileOpener()
    } else if (cmdorctrlKey && event.which === 80) {
      event.preventDefault()
      if (this.state.dialog !== DIALOG_COMMANDS) {
        this.openCommands()
      } else {
        this.closeDialog()
      }
    } else if (cmdorctrlKey && event.which === 82) {
      event.preventDefault()
      if (loaded) {
        this.props.undoMessageChanges()
      }
    } else if (cmdorctrlKey && event.which === 83) {
      event.preventDefault()
      if (loaded) {
        this.props.saveFile()
      }
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
    const {loaded} = this.props
    const extname = path.extname(file.name)
    if (extname === '.txt') {
      if (!loaded) {
        return
      }
      const reader = new FileReader()
      reader.onloadend = (e) => {
        let text = e.target.result
        this.props.loadSource(text)
      }
      reader.readAsText(file)
    } else if (extname === '.z64') {
      const reader = new FileReader()
      reader.onloadend = (e) => {
        let buffer = Buffer.from(e.target.result)
        let name = file.name
        this.props.setFile(buffer, name)
      }
      reader.readAsArrayBuffer(file)
    }
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
              : dialog === DIALOG_COMMANDS ? <Commands close={this.closeDialog} showFileOpener={this.showFileOpener} openFinder={this.openFinder} openGoto={this.openGoto} />
                : null
        }
        {loaded ? <React.Fragment><div styleName='row'><Editor /><Changes /></div><StatusBar /></React.Fragment> : <Landing />}
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
  return bindActionCreators({setFile, loadSource, saveFile, setMessageDeleteState, undoMessageChanges}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
