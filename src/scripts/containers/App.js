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

const DIALOG_NONE = false
const DIALOG_FINDER = 1
const DIALOG_GOTO = 2

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

  openFinder = () => {
    this.setState({dialog: DIALOG_FINDER})
  }

  openGoto = () => {
    this.setState({dialog: DIALOG_GOTO})
  }

  closeDialog = () => {
    this.setState({dialog: DIALOG_NONE})
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

  handleDrop = (event) => {
    let file = event.dataTransfer.files[0]
    if (!(file instanceof Blob)) {
      return
    }
    event.preventDefault()
    const reader = new FileReader()
    reader.onloadend = (e) => {
      let buffer = Buffer.from(e.target.result)
      let name = file.name
      this.props.setFile(buffer, name)
    }
    reader.readAsArrayBuffer(file)
  }

  render () {
    const {loaded} = this.props
    const {dialog} = this.state
    return (
      <div onDrop={this.handleDrop} onDragOver={this.handleDragOver} onClick={this.handleClick} styleName='container'>
        {
          dialog === DIALOG_FINDER ? <Finder close={this.closeDialog} />
            : dialog === DIALOG_GOTO ? <Goto close={this.closeDialog} />
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
