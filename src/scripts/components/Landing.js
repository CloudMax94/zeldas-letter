import React from 'react'
import './Landing.css'
import ImmutablePureComponent from './ImmutablePureComponent'

let cmdorctrlString = 'Ctrl'
if (navigator.platform.indexOf('Mac') > -1) {
  cmdorctrlString = '⌘'
}
const messages = [
  (<div>
    Drop a ROM anywhere to load it
  </div>),
  (<div>
    Search for messages using <span styleName='keystroke'>{cmdorctrlString}+F</span>
  </div>),
  (<div>
    Open a message by ID with <span styleName='keystroke'>{cmdorctrlString}+G</span>
  </div>),
  (<div>
    Save ROM with <span styleName='keystroke'>{cmdorctrlString}+S</span>
  </div>)
  // (<div>
  //   Holding down <span styleName='keystroke'>Shift</span> allows you to scroll between messages
  // </div>)
]

export default class Landing extends ImmutablePureComponent {
  constructor (props) {
    super(props)
    this.state = {
      currentMessage: 0
    }
  }
  componentDidMount () {
    this.interval = setInterval(this.nextMessage, 5000)
  }
  componentWillUnmount () {
    clearInterval(this.interval)
  }
  nextMessage = () => {
    this.setState({currentMessage: (this.state.currentMessage + 1) % messages.length})
  }
  render () {
    const {currentMessage} = this.state
    return (
      <div styleName='container'>
        {messages.map((message, i) => {
          let styles = ['message']
          if (i === currentMessage) {
            styles.push('message-visible')
          }
          return (
            <div key={i} styleName={styles.join(' ')}>
              {message}
            </div>
          )
        })}
      </div>
    )
  }
}
