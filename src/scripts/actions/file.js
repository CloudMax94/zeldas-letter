import * as FILE from '../constants/file'

import {List, Record} from 'immutable'
import { pad, japaneseStringToInternational } from '../utils/format'

import Parser from '../utils/parser'
import FileSaver from 'file-saver'

// TODO: Add a way to customize these configs. Probably in localstorage with a simple UI for it
const ROM_CONFIG = {
  debug: {
    dma_table_address: 0x00012F70,
    message_table_offset: 0x12E4C0,
    character_width_table_offset: 0x136BA0,
    icon_item_static: 7,
    icon_item_24_static: 8,
    message_static: 18,
    nes_font_static: 20,
    message_data_static: [21, 22, 23],
    code: 28,
    languages: ['English', 'German', 'French']
  },
  ntsc10: {
    dma_table_address: 0x00007430,
    message_table_offset: 0x0F98AC,
    character_width_table_offset: 0x101EA0,
    icon_item_static: 8,
    icon_item_24_static: 9,
    message_static: 18,
    jpn_font_static: 6,
    nes_font_static: 21,
    message_data_static: [19, 22],
    code: 27,
    languages: ['Japanese', 'English']
  }
}

const MessageDataRecord = Record({
  text: List(),
  type: 0,
  position: 0
})

const MessageRecord = Record({
  id: 0,
  data: new MessageDataRecord(),
  original: new MessageDataRecord(),
  html: List(),
  plaintext: List()
})

let cmdorctrlString = 'Ctrl'
if (navigator.platform.indexOf('Mac') > -1) {
  cmdorctrlString = '⌘'
}

function formatInfo (str) {
  return pad(Array(17).join(' '), `[${str.replace(/cmdorctrl/g, cmdorctrlString)}]`, true)
}

const infoText = `

This message is excluded in searches and is not saved.
It can be accessed directly by going to message 0.

Shortcuts:
${formatInfo('cmdorctrl+F')}Search for message
${formatInfo('cmdorctrl+G')}Go to Message ID
${formatInfo('cmdorctrl+S')}Save ROM file

Special characters:
[A], [B], [C], [L], [R], [Z],
[^], [v], [<], [>]
[STICK], [+], [TARGET]

Control codes:
[br]            Start next textbox
[i]             Start instant text output
[/i]            End instant text output
[stay]          Keep message box opened. No reaction to buttons. Stop printing
[event]         Wait for an event? Used by minigames & when receiving some things
[UNK_0D]        UNUSED. Wait for button press before continuing printing text
[name]          Prints the player name
[ocarina]       Initialize Ocarina playing
[UNK_11]        UNUSED. Fade out and wait. Stop printing
[marathon]      Print Marathon time
[race]          Print Race time
[points]        Print number of points
[skulltulas]    Print number of skulltulas collected
[noskip]        Prevents the following text from being skipped with B
[ch2]           Initialize two-choice selection
[ch3]           Initialize three-choice selection
[fish]          Print the weight (or length in japanese) of the caught fish
[time]          Print the in-game world time

[br=0x00]       Start next textbox after X number of visual frames
[color=0x00]    Color the following text with color X
[/color]        Resets to the default color
[step=0x00]     Step X pixels to the right before printing the next character
[fade=0x00]     Fade out after waiting X visual frames
[icon=0x00]     Display icon X
[speed=0x00]    Set Number of frames to wait between printing each character
[record=0x00]   Print the highscore for minigame X

[next=0x0000]   Continue at message X after current textbox
[sound=0x0000]  Play sound effect X
[bg=0x000000]   Set message background to X
`

const infoJapanese = `
Hylian:
{あ}{い}{う}{え}{お}  {か}{き}{く}{け}{こ}
{さ}{し}{す}{せ}{そ}  {た}{ち}{つ}{て}{と}
{な}{に}{ぬ}{ね}{の}  {は}{ひ}{ふ}{へ}{ほ}
{ま}{み}{む}{め}{も}  {ら}{り}{る}{れ}{ろ}
{や}    {ゆ}   {よ}  {わ}        {ん}{を}

Hylian can also be written as rōmaji:
{a} {i}  {u} {e} {o}   {ka}{ki} {ku} {ke}{ko}
{sa}{shi}{su}{se}{so}  {ta}{chi}{tsu}{te}{to}
{na}{ni} {nu}{ne}{no}  {ha}{hi} {fu} {he}{ho}
{ma}{mi} {mu}{me}{mo}  {ra}{ri} {ru} {re}{ro}
{ya}     {yu}    {yo}  {wa}          {n} {wo}`

/*****
`





[color=0x40][step=0x1C]Version 1.0.0
[step=0x10]cloudmodding.com[stay]`
******/

const defaultMessageTexts = {
  Japanese: `[step=0x46][color=0xC01]ゼルダの手紙[/color]
[step=0x44][icon=0x23]
[step=0x3]作者：[color=0xC04]クラウドマックス[/color][stay]`,
  English: `[step=0x3B][color=0x41]Zelda's Letter[/color]
[step=0x3A][icon=0x23]

[step=0x08]Written by [color=0x44]CloudMax[stay]`,
  German: `[step=0x40][color=0x41]Zeldas Brief[/color]
[step=0x3A][icon=0x23]

Geschrieben von [color=0x44]CloudMax[stay]`,
  French: `[step=0x36][color=0x41]Lettre de Zelda[/color]
[step=0x3A][icon=0x23]

[step=0x0D]Écrit par [color=0x44]CloudMax[stay]`
}

function prepareDefaultMessage (messages, gameId, languages) {
  let texts = []
  let html = []
  let plaintext = []
  for (let i = 0; i < languages.length; i++) {
    let language = languages[i]
    let japanese = language === 'Japanese'
    let text = defaultMessageTexts['English']
    if (defaultMessageTexts[language]) {
      text = defaultMessageTexts[language]
    }
    if (gameId === 'ntsc10') {
      text += '\n\n!!!NTSC 1.0 SAVING IS NOT SUPPORTED AT THE MOMENT, ROM WILL BREAK!!!'
    }
    text += infoText
    if (japanese) {
      text += infoJapanese
    }
    texts.push(text)
    let buffer = Parser.textToBuffer(text, japanese)
    html.push(Parser.bufferToHtml(buffer, false, japanese))
    plaintext.push(Parser.bufferToHtml(buffer, true, japanese))
  }

  let defaultMessageData = new MessageDataRecord({
    text: List(texts),
    type: 2,
    position: 2
  })

  let defaultMessage = new MessageRecord({
    data: defaultMessageData,
    original: defaultMessageData,
    html: List(html),
    plaintext: List(plaintext)
  })

  return messages.unshift(defaultMessage)
}

function prepareMessages (tableBuffer, dataBuffers, languages) {
  let messages = List()

  let i = 0
  while (i < tableBuffer.length) {
    let messageId = tableBuffer.readUInt16BE(i)

    // Reached the end of the first language
    if (messageId === 0xFFFD) {
      i += 16
      break
    }

    let messageType = tableBuffer.readUInt8(i + 2)
    let messageAddress = tableBuffer.readUInt32BE(i + 4) & 0x00FFFFFF

    let messageEnd = tableBuffer.readUInt32BE(i + 4 + 8) & 0x00FFFFFF

    let japanese = languages[0] === 'Japanese'
    let buffer = dataBuffers[0].slice(messageAddress, messageEnd)
    let text = Parser.bufferToText(buffer, japanese)
    let html = Parser.bufferToHtml(buffer, false, japanese)
    let plaintext = Parser.bufferToHtml(buffer, true, japanese)
    if (japanese) {
      plaintext = japaneseStringToInternational(plaintext)
    }

    let data = new MessageDataRecord({
      text: List([text]),
      type: messageType >> 4,
      position: messageType & 0x0F
    })

    /*
    let compareBuffer = Parser.textToBuffer(text)
    if (!buffer.equals(compareBuffer)) {
      console.warn(`Message ${messageId} was changed when converting buffer -> text -> buffer`, buffer, compareBuffer)
    }
    */

    messages = messages.push(new MessageRecord({
      id: messageId,
      data: data,
      html: List([html]),
      plaintext: List([plaintext])
    }))

    i += 8
  }

  console.log('Reading extra language entries')

  let language = 1
  let counter = 0
  while (i < tableBuffer.length) {
    if (language >= dataBuffers.length) {
      break
    }
    let messageId

    if (languages[language] === 'English') {
      // Special handling for English in NTSC version
      messageId = tableBuffer.readUInt16BE(i)
      if (messageId === 0xFFFD) {
        break
      }
      i += 4
    } else {
      messageId = messages.getIn([counter, 'id'])
    }

    if (messageId === 0xFFFC) {
      counter = 0
      language++
      i += 8
      continue
    }

    let messageAddress = tableBuffer.readUInt32BE(i) & 0x00FFFFFF

    let messageEnd
    if (i + 8 < tableBuffer.length) {
      messageEnd = tableBuffer.readUInt32BE(i + 4) & 0x00FFFFFF
    } else {
      messageEnd = dataBuffers[language].length
    }
    let index = messages.findIndex(message =>
      message.get('id') === messageId
    )
    // FIXME: English entries that do not have a japanese equivalent are skipped!
    if (index >= 0) {
      let buffer = dataBuffers[language].slice(messageAddress, messageEnd)
      let text = Parser.bufferToText(buffer)
      messages = messages.setIn([index, 'data', 'text', language], text)
      messages = messages.setIn([index, 'html', language], Parser.bufferToHtml(buffer))
      messages = messages.setIn([index, 'plaintext', language], Parser.bufferToHtml(buffer, true))
    }
    i += 4
    counter++
  }

  for (let i = 0; i < messages.size; i++) {
    messages = messages.setIn([i, 'original'], messages.getIn([i, 'data']))
  }

  console.log(messages.toJS())
  return messages
}

function saveMessagesAsText (messages, languages) {
  messages = messages.shift() // Exclude the special 0 message
  const textOutputs = []
  for (let i = 0; i < languages.length; i++) {
    textOutputs[i] = [`[language=${i}]`]
  }
  for (let i = 0; i < messages.size; i++) {
    const message = messages.get(i)
    const id = message.get('id')
    const type = message.getIn(['data', 'type'])
    const position = message.getIn(['data', 'position']) & 0x0F
    for (let lang = 0; lang < languages.length; lang++) {
      const text = message.getIn(['data', 'text', lang])
      if (lang === 0) {
        textOutputs[lang].push(`[message=${pad('0000', id.toString(16).toUpperCase())},${type.toString(16).toUpperCase()},${position.toString(16).toUpperCase()}]\n${text}`)
      } else {
        if (id === 0xFFFC) {
          continue
        }
        textOutputs[lang].push(`[message=${pad('0000', id.toString(16).toUpperCase())}]\n${text}`)
      }
    }
  }
  for (let lang = 0; lang < languages; lang++) {
    textOutputs[lang] = textOutputs[lang].join('\n\n')
  }
  return textOutputs.join('\n')
}

function saveMessages (messages, languages) {
  messages = messages.shift() // Exclude the special 0 message
  const tableBuffers = []
  const dataBuffers = []
  for (let i = 0; i < languages.length; i++) {
    dataBuffers[i] = Buffer.alloc(0)
    tableBuffers[i] = Buffer.alloc(0)
  }
  let fffcStart = 0
  let fffcEnd = 0
  for (let i = 0; i < messages.size; i++) {
    const message = messages.get(i)
    const id = message.get('id')
    const type = message.getIn(['data', 'type']) & 0x0F
    const position = message.getIn(['data', 'position']) & 0x0F
    for (let lang = 0; lang < languages.length; lang++) {
      const text = message.getIn(['data', 'text', lang])
      const offset = dataBuffers[lang].length
      let buffer = Parser.textToBuffer(text, languages[lang] === 'Japanese')
      let newTableEntry
      if (lang === 0) {
        if (id === 0xFFFC) {
          fffcStart = 0x07000000 | offset
          fffcEnd = fffcStart + buffer.length
          console.log('saving message 0xFFFC', fffcStart.toString(16), fffcEnd.toString(16))
        }
        newTableEntry = Buffer.alloc(8)
        newTableEntry.writeUInt16BE(id, 0)
        newTableEntry.writeUInt8((type << 4) | position, 2)
        // FIXME: Japanese entries are 0x08000000
        newTableEntry.writeUInt32BE(0x07000000 | offset, 4)
      } else {
        newTableEntry = Buffer.alloc(4)
        // FIXME: Japanese entries are 0x08000000
        newTableEntry.writeUInt32BE(0x07000000 | offset, 0)
      }
      tableBuffers[lang] = Buffer.concat([tableBuffers[lang], newTableEntry])
      dataBuffers[lang] = Buffer.concat([dataBuffers[lang], buffer])
    }
  }
  for (let lang = 0; lang < languages.length; lang++) {
    if (lang === 0) {
      // We add the 0xFFFD & 0xFFFF entries to the primary language
      let appendBuffer = Buffer.alloc(16)
      appendBuffer.writeUInt16BE(0xFFFD, 0)
      appendBuffer.writeUInt32BE(fffcEnd, 4)
      appendBuffer.writeUInt16BE(0xFFFF, 8)
      tableBuffers[lang] = Buffer.concat([tableBuffers[lang], appendBuffer])
    } else {
      // FIXME: English entries on NTSC are complete with ID, type & position
      // We add the 0x00000000 end markers to the extra languages
      tableBuffers[lang] = Buffer.concat([tableBuffers[lang], Buffer.alloc(4)])
    }
  }
  return [Buffer.concat(tableBuffers), dataBuffers, [fffcStart, fffcEnd]]
}

function getFileAddress (tableAddress, buffer, fileId) {
  let entryAddress = tableAddress + fileId * 0x10
  let start = buffer.readUInt32BE(entryAddress)
  let end = buffer.readUInt32BE(entryAddress + 0x4)
  return [start, end]
}

function setFileLength (tableAddress, buffer, fileId, length) {
  let entryAddress = tableAddress + fileId * 0x10
  let start = buffer.readUInt32BE(entryAddress)
  buffer.writeUInt32BE(start + length, entryAddress + 0x4)
  return buffer
}

function getFileBuffer (tableAddress, buffer, fileId) {
  return buffer.slice(...getFileAddress(...arguments))
}

function getGameId (buffer) {
  let id = buffer.readUInt32BE(0x3B)
  if (id === 0x435A4C4A || id === 0x435A4C55) { // NTSC-J or NTSC-U
    if (buffer.readUInt8(0x3F) === 0) { // Version 1.0
      return 'ntsc10'
    }
  }
  return 'debug'
}

export function saveFile () {
  return async (dispatch, getState) => {
    let store = getState().file
    let messages = store.get('messages')
    let buffer = store.get('buffer')
    let name = store.get('name')

    let config = ROM_CONFIG[getGameId(buffer)]

    let [tableBuffer, dataBuffers, fffcRange] = saveMessages(messages, config.languages)

    console.log(fffcRange[0].toString(16), fffcRange[1].toString(16))

    // TEST COMPARE START
    let [codeStart] = getFileAddress(config.dma_table_address, buffer, config.code)
    let compareBuffer = buffer.slice(
      codeStart + config.message_table_offset,
      codeStart + config.message_table_offset + 0x8448
    )
    if (tableBuffer.equals(compareBuffer)) {
      console.log('Output is identical!')
    } else {
      for (let i = 0; i < compareBuffer.length && i < tableBuffer.length; i += 8) {
        let ida = compareBuffer.readUInt16BE(i)
        let idb = tableBuffer.readUInt16BE(i)
        if (ida !== idb) {
          console.log(`ID ${ida.toString(16).toUpperCase()} has changed to ${idb.toString(16).toUpperCase()}!`)
        }
      }
    }
    // TEST COMPARE END

    // Write message table
    buffer = Buffer.concat([
      buffer.slice(0, codeStart + config.message_table_offset),
      tableBuffer,
      buffer.slice(codeStart + config.message_table_offset + tableBuffer.length)
    ])

    console.log('table', tableBuffer)

    // Write language data & update size in file table
    let prevEnd = 0
    for (let i = 0; i < config.message_data_static.length; i++) {
      let fileId = config.message_data_static[i]
      let [langStart] = getFileAddress(config.dma_table_address, buffer, fileId)
      if (langStart < prevEnd) {
        console.warn(`Language ${i} data is overlapping the end of language ${i - 1}!`)
      }
      let dataBuffer = dataBuffers[i]
      console.log(`lang ${i} ${langStart.toString(16).toUpperCase()}-${(langStart + dataBuffer.length).toString(16).toUpperCase()}`, dataBuffer)
      buffer = Buffer.concat([buffer.slice(0, langStart), dataBuffer, buffer.slice(langStart + dataBuffer.length)])
      setFileLength(config.dma_table_address, buffer, fileId, dataBuffer.length)
      prevEnd = langStart + dataBuffer.length
    }

    // Fix hardcoded FFFC start and end address
    buffer.writeUInt32BE(0x3C080000 | fffcRange[0] >>> 16, codeStart + 0x520B4) // 0x3C08 = LUI T0
    buffer.writeUInt32BE(0x35080000 | fffcRange[0] & 0xFFFF, codeStart + 0x520B8) // 0x3508 = ORI T0, T0
    buffer.writeUInt32BE(0x3C0F0000 | fffcRange[1] >>> 16, codeStart + 0x520C4) // 0x3C0F = LUI T7
    buffer.writeUInt32BE(0x35EF0000 | fffcRange[1] & 0xFFFF, codeStart + 0x520F0) // 0x35EF = ORI T7, T7

    let blob = new Blob([buffer])
    FileSaver.saveAs(blob, name)

    dispatch({
      type: FILE.FILE_SAVED
    })

    // 0x520B4 = 0x3C080000 | 0x0703    // 0x3C08 = LUI T0
    // 0x520B8 = 0x350880D4 | 0x80D4    // 0x3508 = ORI T0, T0
    // 0x520C4 = 0x3C0F0000 | 0x0703    // 0x3C0F = LUI T7
    // 0x520F0 = 0x35EF0000 | 0x811C    // 0x35EF = ORI T7, T7

    // 0xFFFC 0x00 0x00 0x070380D4
    // 0xFFFD 0x00 0x00 0x0703811C

    // 0x8006EF14 = 0x0703 (upper half of 0xFFFC start)
    // 0x8006EF18 = 0x80D4 (lower half of 0xFFFC start)

    // 0x8006EF24 = 0x0703 (upper half of 0xFFFC end)
    // 0x8006EF50 = 0x811C (lower half of 0xFFFC end)
  }
}

export function setFile (buffer, name) {
  return async (dispatch, getState) => {
    let gameId = getGameId(buffer)
    let config = ROM_CONFIG[gameId]

    // FIXME: Load until first 0xFFFD instead of hardcoded 0x8448 length?
    let [codeStart] = getFileAddress(config.dma_table_address, buffer, config.code)
    let messageTableBuffer = buffer.slice(codeStart + config.message_table_offset, codeStart + config.message_table_offset + 0x8448)

    Parser.iconItemStatic = getFileBuffer(config.dma_table_address, buffer, config.icon_item_static)
    Parser.iconItem24Static = getFileBuffer(config.dma_table_address, buffer, config.icon_item_24_static)
    Parser.messageStatic = getFileBuffer(config.dma_table_address, buffer, config.message_static)
    Parser.nesFontStatic = getFileBuffer(config.dma_table_address, buffer, config.nes_font_static)
    if (config.jpn_font_static) {
      Parser.jpnFontStatic = getFileBuffer(config.dma_table_address, buffer, config.jpn_font_static)
    }
    Parser.characterWidthData = buffer.slice(
      codeStart + config.character_width_table_offset,
      codeStart + config.character_width_table_offset + 0x4 * 0x90
    )

    let messageDataStaticBuffers = []
    for (let fileId of config.message_data_static) {
      messageDataStaticBuffers.push(getFileBuffer(config.dma_table_address, buffer, fileId))
    }
    let messages = prepareMessages(messageTableBuffer, messageDataStaticBuffers, config.languages)

    messages = prepareDefaultMessage(messages, gameId, config.languages)
    dispatch({
      type: FILE.SET_FILE,
      buffer: buffer,
      name: name,
      messages: messages,
      languages: List(config.languages)
    })
  }
}

export function setMessageType (id, value) {
  return {
    type: FILE.SET_MESSAGE_TYPE,
    id,
    value
  }
}

export function setMessagePosition (id, value) {
  return {
    type: FILE.SET_MESSAGE_POSITION,
    id,
    value
  }
}

export function setMessageText (id, text, language) {
  return async (dispatch, getState) => {
    let languages = getState().file.get('languages')
    let japanese = languages.get(language) === 'Japanese'
    let buffer = Parser.textToBuffer(text, japanese)
    let html = Parser.bufferToHtml(buffer, false, japanese)
    let plaintext = Parser.bufferToHtml(buffer, true, japanese)
    if (japanese) {
      plaintext = japaneseStringToInternational(plaintext)
    }
    dispatch({
      type: FILE.SET_MESSAGE_TEXT,
      id,
      text,
      html,
      plaintext,
      language
    })
  }
}