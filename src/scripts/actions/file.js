import * as FILE from '../constants/file'

import {List, Record} from 'immutable'
import { pad, japaneseStringToInternational } from '../utils/format'

import Parser from '../utils/parser'
import FileSaver from 'file-saver'

// TODO: Add a way to add your own configs. Probably in localstorage with a simple UI for it
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
    fffc: [
      [0x520B4, 0x3C080000],
      [0x520B8, 0x35080000],
      [0x520C4, 0x3C0F0000],
      [0x520F0, 0x35EF0000]
    ],
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
    fffc: [
      [0x4ACE0, 0x3C070000],
      [0x4ACE4, 0x34E70000],
      [0x4AD14, 0x3C0F0000],
      [0x4AD1C, 0x35EF0000]
    ],
    languages: ['Japanese', 'English']
  },
  ntsc11: {
    dma_table_address: 0x00007430,
    message_table_offset: 0x0F9A6C,
    character_width_table_offset: 0x102060,
    icon_item_static: 8,
    icon_item_24_static: 9,
    message_static: 18,
    jpn_font_static: 6,
    nes_font_static: 21,
    message_data_static: [19, 22],
    code: 27,
    fffc: [
      [0x4ACE0, 0x3C070000],
      [0x4ACE4, 0x34E70000],
      [0x4AD14, 0x3C0F0000],
      [0x4AD1C, 0x35EF0000]
    ],
    languages: ['Japanese', 'English']
  },
  ntsc12: {
    dma_table_address: 0x00007960,
    message_table_offset: 0x0F991C,
    character_width_table_offset: 0x101F10,
    icon_item_static: 8,
    icon_item_24_static: 9,
    message_static: 18,
    jpn_font_static: 6,
    nes_font_static: 20,
    message_data_static: [21, 22],
    code: 27,
    fffc: [
      [0x4AD30, 0x3C070000],
      [0x4AD34, 0x34E70000],
      [0x4AD64, 0x3C0F0000],
      [0x4AD6C, 0x35EF0000]
    ],
    languages: ['Japanese', 'English']
  },
  ntsczc: { // ZC GCN (NTSC)
    dma_table_address: 0x00007170,
    message_table_offset: 0x0F8FAC,
    character_width_table_offset: 0x1015A0,
    icon_item_static: 8,
    icon_item_24_static: 9,
    message_static: 18,
    jpn_font_static: 6,
    nes_font_static: 20,
    message_data_static: [21, 22],
    code: 27,
    fffc: [
      [0x4AAC0, 0x3C070000],
      [0x4AAC4, 0x34E70000],
      [0x4AAF4, 0x3C0F0000],
      [0x4AAFC, 0x35EF0000]
    ],
    languages: ['Japanese', 'English']
  },
  jpngcn: { // GCN (J)
    dma_table_address: 0x00007170,
    message_table_offset: 0x0F8FCC,
    character_width_table_offset: 0x1015C0,
    icon_item_static: 8,
    icon_item_24_static: 9,
    message_static: 18,
    jpn_font_static: 6,
    nes_font_static: 20,
    message_data_static: [21, 22],
    code: 27,
    fffc: [
      [0x4AAE0, 0x3C070000],
      [0x4AAE4, 0x34E70000],
      [0x4AB14, 0x3C0F0000],
      [0x4AB1C, 0x35EF0000]
    ],
    languages: ['Japanese', 'English']
  },
  jpnmq: { // Master Quest (J)
    dma_table_address: 0x00007170,
    message_table_offset: 0x0F8FAC,
    character_width_table_offset: 0x1015A0,
    icon_item_static: 8,
    icon_item_24_static: 9,
    message_static: 18,
    jpn_font_static: 6,
    nes_font_static: 20,
    message_data_static: [21, 22],
    code: 27,
    fffc: [
      [0x4AAE0, 0x3C070000],
      [0x4AAE4, 0x34E70000],
      [0x4AB14, 0x3C0F0000],
      [0x4AB1C, 0x35EF0000]
    ],
    languages: ['Japanese', 'English']
  },
  usamq: { // Master Quest (U)
    dma_table_address: 0x00007170,
    message_table_offset: 0x0F8F8C,
    character_width_table_offset: 0x101580,
    icon_item_static: 8,
    icon_item_24_static: 9,
    message_static: 18,
    jpn_font_static: 6,
    nes_font_static: 20,
    message_data_static: [21, 22],
    code: 27,
    fffc: [
      [0x4AAC0, 0x3C070000],
      [0x4AAC4, 0x34E70000],
      [0x4AAF4, 0x3C0F0000],
      [0x4AAFC, 0x35EF0000]
    ],
    languages: ['Japanese', 'English']
  },
  pal10: {
    dma_table_address: 0x00007950,
    message_table_offset: 0x0F71DC,
    character_width_table_offset: 0x0FF8BC,
    icon_item_static: 7,
    icon_item_24_static: 8,
    message_static: 18,
    nes_font_static: 20,
    message_data_static: [21, 22, 23],
    code: 28,
    fffc: [
      [0x4ACA0, 0x3C070000],
      [0x4ACA4, 0x34E70000],
      [0x4ACD4, 0x3C0F0000],
      [0x4ACDC, 0x35EF0000]
    ],
    languages: ['English', 'German', 'French']
  },
  pal11: {
    dma_table_address: 0x00007950,
    message_table_offset: 0x0F721C,
    character_width_table_offset: 0x0FF8FC,
    icon_item_static: 7,
    icon_item_24_static: 8,
    message_static: 18,
    nes_font_static: 20,
    message_data_static: [21, 22, 23],
    code: 28,
    fffc: [
      [0x4ACA0, 0x3C070000],
      [0x4ACA4, 0x34E70000],
      [0x4ACD4, 0x3C0F0000],
      [0x4ACDC, 0x35EF0000]
    ],
    languages: ['English', 'German', 'French']
  },
  palgcn: { // GCN (PAL)
    dma_table_address: 0x00007170,
    message_table_offset: 0x0F6910,
    character_width_table_offset: 0x0FEFF0,
    icon_item_static: 7,
    icon_item_24_static: 8,
    message_static: 18,
    nes_font_static: 20,
    message_data_static: [21, 22, 23],
    code: 28,
    fffc: [
      [0x4AA50, 0x3C070000],
      [0x4AA54, 0x34E70000],
      [0x4AA84, 0x3C0F0000],
      [0x4AA8C, 0x35EF0000]
    ],
    languages: ['English', 'German', 'French']
  },
  palmq: { // Master Quest (E)
    dma_table_address: 0x00007170,
    message_table_offset: 0x0F68F0,
    character_width_table_offset: 0x0FEFD0,
    icon_item_static: 7,
    icon_item_24_static: 8,
    message_static: 18,
    nes_font_static: 20,
    message_data_static: [21, 22, 23],
    code: 28,
    fffc: [
      [0x4AA50, 0x3C070000],
      [0x4AA54, 0x34E70000],
      [0x4AA84, 0x3C0F0000],
      [0x4AA8C, 0x35EF0000]
    ],
    languages: ['English', 'German', 'French']
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
${formatInfo('cmdorctrl+P')}Bring up all commands
${formatInfo('cmdorctrl+F')}Search for message
${formatInfo('cmdorctrl+G')}Go to Message ID
${formatInfo('cmdorctrl+O')}Open ROM file
${formatInfo('cmdorctrl+S')}Save ROM file

Special characters:
[A], [B], [C], [L], [R], [Z],
[^], [v], [<], [>]
[STICK], [+], [TARGET]

[+] is only available for the international languages on GCN ROMs.

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

const versionString = `Version 0.2.1`

const versionStringInt = `





[step=0x1C]${versionString}
[step=0x10]cloudmodding.com`

const versionStringJp = `



[step=0x53]${versionString}
[step=0x15]cloudmodding.com`

const defaultMessageTexts = {
  Japanese: `[step=0x46][color=0xC01]ゼルダの手紙[/color]
[step=0x44][icon=0x23]
[step=0x3]作者：[color=0xC04]クラウドマックス[/color]${versionStringJp}[stay]`,
  English: `[step=0x3B][color=0x41]Zelda's Letter[/color]
[step=0x3A][icon=0x23]

[step=0x08]Written by [color=0x44]CloudMax[/color]${versionStringInt}[stay]`,
  German: `[step=0x40][color=0x41]Zeldas Brief[/color]
[step=0x3A][icon=0x23]

Geschrieben von [color=0x44]CloudMax[/color]${versionStringInt}[stay]`,
  French: `[step=0x36][color=0x41]Lettre de Zelda[/color]
[step=0x3A][icon=0x23]

[step=0x0D]Écrit par [color=0x44]CloudMax[/color]${versionStringInt}[stay]`
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
  let language = 0
  const hasJapanese = languages.indexOf('Japanese') >= 0
  let counter = 0
  while (i < tableBuffer.length && language < languages.length) {
    let messageId
    if (language === 0 || hasJapanese) {
      messageId = tableBuffer.readUInt16BE(i)
    } else {
      messageId = messages.getIn([counter, 'id'])
    }
    if (messageId === 0xFFFD) {
      console.log(`Found 0xFFFD marker for language ${language + 1}`)
      i += 8
      continue
    }
    // Reached the end of japanese/english or a PAL translation
    if (messageId === 0xFFFF || (!hasJapanese && language > 0 && messageId === 0xFFFC)) {
      console.log(`Found 0x${messageId.toString(16).toUpperCase()} marker for language ${language + 1}`)
      i += 8
      language++
      counter = 0
      continue
    }

    let index = messages.findIndex(message =>
      message.get('id') === messageId
    )

    let message
    if (index < 0) {
      message = new MessageRecord({id: messageId})
      index = messages.size
    } else {
      message = messages.get(index)
    }
    let messageAddress
    let messageEnd
    if (language === 0 || hasJapanese) {
      let messageType = tableBuffer.readUInt8(i + 2)
      message = message.setIn(['data', 'type'], messageType >> 4)
      message = message.setIn(['data', 'position'], messageType & 0x0F)
      i += 4
      messageEnd = tableBuffer.readUInt32BE(i + 8) & 0x00FFFFFF
    } else {
      messageEnd = tableBuffer.readUInt32BE(i + 4) & 0x00FFFFFF
    }
    messageAddress = tableBuffer.readUInt32BE(i) & 0x00FFFFFF

    const isJapanese = languages[language] === 'Japanese'
    let buffer = dataBuffers[language].slice(messageAddress, messageEnd)
    let text = Parser.bufferToText(buffer, isJapanese)
    let html = Parser.bufferToHtml(buffer, false, isJapanese)
    let plaintext = Parser.bufferToHtml(buffer, true, isJapanese)
    if (isJapanese) {
      plaintext = japaneseStringToInternational(plaintext)
    }
    message = message.setIn(['data', 'text', language], text)
    message = message.setIn(['html', language], html)
    message = message.setIn(['plaintext', language], plaintext)
    messages = messages.set(index, message)

    i += 4
    counter++
  }

  for (let i = 0; i < messages.size; i++) {
    messages = messages.setIn([i, 'original'], messages.getIn([i, 'data']))
  }

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
  for (let lang = 0; lang < languages.length; lang++) {
    textOutputs[lang] = textOutputs[lang].join('\n\n')
  }
  return textOutputs.join('\n')
}

function saveMessages (messages, languages) {
  messages = messages.shift() // Exclude the special 0 message
  messages = messages.sortBy(message => message.get('id'))
  const tableBuffers = []
  const dataBuffers = []
  const hasJapanese = languages.indexOf('Japanese') >= 0
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
      // TODO: Can remove other languages from the game by simply skipping them here, the game should still run properly.
      // if (lang !== 0) {
      //   break
      // }
      const isJapanese = languages[lang] === 'Japanese'
      const bank = isJapanese ? 0x08000000 : 0x07000000
      const text = message.getIn(['data', 'text', lang])
      if (typeof text === 'undefined' && hasJapanese) {
        console.log(`0x${id.toString(16).toUpperCase()} does not exist for ${languages[lang]}, skipping entry`)
        continue
      }
      const offset = dataBuffers[lang].length
      let buffer = Parser.textToBuffer(text, isJapanese)
      let newTableEntry
      if (lang === 0 && id === 0xFFFC) {
        fffcStart = bank | offset
        fffcEnd = fffcStart + buffer.length
        console.log('saving message 0xFFFC', fffcStart.toString(16), fffcEnd.toString(16))
      }
      if (lang === 0 || hasJapanese) {
        // First language and NTSC are complete with id, type, position & address
        newTableEntry = Buffer.alloc(8)
        newTableEntry.writeUInt16BE(id, 0)
        newTableEntry.writeUInt8((type << 4) | position, 2)
        newTableEntry.writeUInt32BE(bank | offset, 4)
      } else {
        // Additional languages on PAL only have address
        newTableEntry = Buffer.alloc(4)
        newTableEntry.writeUInt32BE(bank | offset, 0)
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
  let ver = buffer.readUInt8(0x3F)
  if (id === 0x435A4C4A || id === 0x435A4C45) { // NTSC-J or NTSC-U
    if (ver === 0) { // Version 1.0
      return 'ntsc10'
    } else if (ver === 1) { // Version 1.1
      return 'ntsc11'
    } else if (ver === 2) { // Version 1.2
      return 'ntsc12'
    }
  } else if (id === 0x4E5A4C50) { // PAL
    if (ver === 0) { // Version 1.0
      return 'pal10'
    } else if (ver === 1) { // Version 1.1
      return 'pal11'
    }
  } else if (id === 0x4E5A4C45) { // Debug
    return 'debug'
  } else { // Unknown ROM ID
    console.log('Unknown ROM ID, assuming debug')
    return 'debug'
  }
  if (ver === 15) { // GCN and MQ
    let configs = []
    let messageCheck = 0x08000000
    if (id === 0x435A4C4A) {
      configs = ['jpnmq', 'ntsczc', 'jpngcn']
    } else if (id === 0x435A4C45) {
      configs = ['usamq', 'ntsczc']
    } else if (id === 0x4E5A4C50) {
      messageCheck = 0x07000000
      configs = ['palmq', 'palgcn']
    }
    for (let configName of configs) {
      let config = ROM_CONFIG[configName]
      let codeAddress = buffer.readUInt32BE(config.dma_table_address + 0x10 * config.code)
      let offset = codeAddress + config.message_table_offset + 4
      // Make sure that we don't read past the buffer
      if (offset + 4 >= buffer.length) {
        continue
      }
      let messageTest = buffer.readUInt32BE(offset)
      console.log(messageTest)
      if (messageTest === messageCheck) {
        let fffcTest = buffer.readUInt16BE(codeAddress + config.fffc[0][0])
        if (fffcTest === config.fffc[0][1] >>> 16) {
          console.log(`The ROM is probably ${configName}`)
          return configName
        }
      }
    }
  }
  // Unknown OoT build
  console.log('Unknown OoT Revision, assuming debug')
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

    let [codeStart] = getFileAddress(config.dma_table_address, buffer, config.code)

    // Write message table
    buffer = Buffer.concat([
      buffer.slice(0, codeStart + config.message_table_offset),
      tableBuffer,
      buffer.slice(codeStart + config.message_table_offset + tableBuffer.length)
    ])

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
    buffer.writeUInt32BE(config.fffc[0][1] | (fffcRange[0] >>> 16), codeStart + config.fffc[0][0])
    buffer.writeUInt32BE(config.fffc[1][1] | (fffcRange[0] & 0xFFFF), codeStart + config.fffc[1][0])
    buffer.writeUInt32BE(config.fffc[2][1] | (fffcRange[1] >>> 16), codeStart + config.fffc[2][0])
    buffer.writeUInt32BE(config.fffc[3][1] | (fffcRange[1] & 0xFFFF), codeStart + config.fffc[3][0])

    let blob = new Blob([buffer])
    FileSaver.saveAs(blob, name)

    dispatch({
      type: FILE.FILE_SAVED
    })
  }
}

export function setFile (buffer, name) {
  return async (dispatch, getState) => {
    let gameId = getGameId(buffer)
    let config = ROM_CONFIG[gameId]

    let [codeStart] = getFileAddress(config.dma_table_address, buffer, config.code)
    let messageTableBuffer = buffer.slice(codeStart + config.message_table_offset)
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
