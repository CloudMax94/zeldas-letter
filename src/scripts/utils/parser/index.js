import {dialogPositions} from './config'
import {controlCodes, endOfMessage} from './config-int'
import {
  controlCodes as controlCodesJ,
  endOfMessage as endOfMessageJ,
  characterTable as characterTableJ
} from './config-jpn'
import {generateTexture} from '@cloudmodding/texture-manipulator/lib'
import Encoding from 'encoding-japanese'
import ieee754 from 'ieee754'

let cachedUnicode = {
  '┭': [0x86, 0xD3]
}
function unicodeCharToSJIS (char) {
  if (char in cachedUnicode) {
    return cachedUnicode[char]
  }
  const charData = Encoding.convert(char, {
    to: 'SJIS',
    from: 'UNICODE',
    type: 'array'
  })
  if (charData.length % 2 === 1) {
    charData.unshift(0)
  }
  cachedUnicode[char] = charData
  return charData
}

let cachedSJIS = {
  0x86D3: '┭'
}
function SJIStoUnicodeChar (sjis) {
  if (sjis in cachedSJIS) {
    return cachedSJIS[sjis]
  }
  let char = Encoding.convert(new Uint8Array([sjis >> 8, sjis & 0xFF]), {
    to: 'UNICODE',
    from: 'SJIS',
    type: 'string'
  })
  cachedSJIS[sjis] = char
  return char
}

function multiplyColor (pixel1, pixel2) {
  return [
    pixel1[0] * pixel2[0] / 0xFF,
    pixel1[1] * pixel2[1] / 0xFF,
    pixel1[2] * pixel2[2] / 0xFF,
    pixel1[3] * pixel2[3] / 0xFF
  ]
}

function multiplyTextureColor (texture, color) {
  for (let i = 0; i < texture.size; i++) {
    texture.setPixel(i, multiplyColor(texture.getPixel(i), color))
  }
}

class MessageEditorParser {
  constructor () {
    this.assets = {
      'icons': [],
      'buttons': [],
      'backgrounds': [],
      'characters': []
    }
  }

  set iconItemStatic (buffer) {
    for (let i = 0; i < 90; i++) {
      let texture = generateTexture(buffer.slice(0x00001000 * i, 0x00001000 * (i + 1)), 'rgba32', 32, 32)
      this.assets.icons[i] = texture.toBase64()
    }
  }

  set iconItem24Static (buffer) {
    for (let i = 0; i < 20; i++) {
      let texture = generateTexture(buffer.slice(0x00000900 * i, 0x00000900 * (i + 1)), 'rgba32', 24, 24)
      this.assets.icons[102 + i] = texture.toBase64()
    }
  }

  set messageStatic (buffer) {
    this.assets.buttons = []
    this.assets.backgrounds = []

    // Background 1
    let texture = generateTexture(buffer.slice(0x00000000, 0x00001000), 'i4', 128, 64)
    multiplyTextureColor(texture, [0x00, 0x00, 0x00, 0xAA])
    this.assets.backgrounds.push(texture.toBase64())

    // Background 2
    texture = generateTexture(buffer.slice(0x00001000, 0x00002000), 'ia4', 128, 64)
    multiplyTextureColor(texture, [0x46, 0x32, 0x1E, 0xE6])
    this.assets.backgrounds.push(texture.toBase64())

    // Background 3
    texture = generateTexture(buffer.slice(0x00003000, 0x00004000), 'i4', 128, 64)
    multiplyTextureColor(texture, [0x00, 0x0A, 0x32, 0xAA])
    this.assets.backgrounds.push(texture.toBase64())

    // Background 4
    texture = generateTexture(buffer.slice(0x00002000, 0x00003000), 'ia4', 128, 64)
    multiplyTextureColor(texture, [0xFF, 0x00, 0x00, 0xB4])
    this.assets.backgrounds.push(texture.toBase64())

    // Buttons
    let i = 0
    while (i < 3) {
      texture = generateTexture(buffer.slice(0x00004000 + (i * 0x80), 0x00004080 + (i * 0x80)), 'i4', 16, 16)
      let j = 0
      while (j < texture.size) {
        let pxl = texture.getPixel(j)
        pxl[0] = 0x32
        pxl[1] = 0xFF
        pxl[2] = 0x82
        texture.setPixel(j, pxl)
        j++
      }
      this.assets.buttons.push(texture.toBase64())
      i++
    }
  }

  set nesFontStatic (buffer) {
    this.nesFontStaticBuffer = buffer
    this.assets.characters = []
  }

  set jpnFontStatic (buffer) {
    this.jpnFontStaticBuffer = buffer
    this.assets.jpn = []
  }

  set characterWidthData (buffer) {
    this.characterWidth = []
    for (let i = 0, l = buffer.length; i < l; i += 4) {
      this.characterWidth[i / 4] = ieee754.read(buffer, i, false, 23, 4)
    }
  }

  getCharacterIndexJ (charCode) {
    let upperByte = charCode >> 0x8
    let c = 0x00BC
    let base = (charCode & 0xFF) - 0x40
    if (base >= 0x40) {
      base -= 1
    }
    if (charCode >= 0x8800) {
      return base + 0x030A + c * (upperByte - 0x88)
    }
    return characterTableJ[base + c * (upperByte - 0x81)]
  }

  getCharacter (char, color, japanese) {
    if (japanese) {
      char = this.getCharacterIndexJ(char)
      if (!(char >= 0)) {
        return
      }
    }
    let charset = this.assets.characters
    if (japanese) {
      charset = this.assets.jpn
    }
    if (!charset[char]) {
      charset[char] = {}
    }
    if (!charset[char][color]) {
      let fontBuffer = this.nesFontStaticBuffer
      if (japanese) {
        fontBuffer = this.jpnFontStaticBuffer
      }
      let offset = char * 0x80
      if (offset + 0x80 > fontBuffer.length) {
        // console.warn(`Tried to load out-of-range ${japanese ? 'japanese ' : ''}character ${char}`)
        return
      }
      // Create character texture
      let buffer = fontBuffer.slice(offset, offset + 0x80)
      let texture = generateTexture(buffer, 'i4', 16, 16)
      const r = parseInt(color.substr(1, 2), 16)
      const g = parseInt(color.substr(3, 2), 16)
      const b = parseInt(color.substr(5, 2), 16)
      for (let i = 0; i < texture.size; i++) {
        let pxl = texture.getPixel(i)
        pxl[0] = r
        pxl[1] = g
        pxl[2] = b
        texture.setPixel(i, pxl)
      }
      charset[char][color] = texture.toBase64()
      console.log(`Loaded ${japanese ? 'japanese ' : ''}character 0x${char.toString(16).toUpperCase()} with color ${color}`)
    }
    return charset[char][color]
  }

  textToBuffer (text, japanese) {
    let byteLength = japanese ? 2 : 1
    let eom = japanese ? endOfMessageJ : endOfMessage
    let codes = japanese ? controlCodesJ : controlCodes

    let data = []
    let index = 0
    function step (len) {
      index += len
      text = text.substr(len)
    }

    // We find where all bracketed control codes are and store them to improve performance
    let regExp = /\[([^=[\]]+)(?:=((?:0x)?[0-9a-fA-F]+))?\]/g
    let controlMatches = {}
    let controlCodeEntries = Object.entries(codes)
    let toBinaryEntries = controlCodeEntries.filter(([, controlCode]) => typeof controlCode.toBinary === 'function')
    let tagEntries = controlCodeEntries.filter(([, controlCode]) => typeof controlCode.toBinary !== 'function')
    while (true) {
      const match = regExp.exec(text)
      if (match === null) {
        break
      }
      controlMatches[match.index] = {
        match: match[0],
        tag: match[1],
        argument: match[2],
        length: match[0].length
      }
    }

    while (text != null ? text.length : undefined) {
      let found = false
      // Check toBinary functions for a match
      for (let [, controlCode] of toBinaryEntries) {
        let [steps, value] = controlCode.toBinary(text) || []
        if (steps) {
          step(steps)
          data.push(...value)
          found = true
          break
        }
      }
      if (found) {
        continue
      }
      // Check if currently at a control code match
      if (index in controlMatches) {
        let match = controlMatches[index]
        let tag = match.tag.toLowerCase()
        for (let [code, controlCode] of tagEntries) {
          if (controlCode.tag.toLowerCase() !== tag) {
            continue
          }
          if ((!controlCode.args && typeof match.argument !== 'undefined') || (controlCode.args && typeof match.argument === 'undefined')) {
            // Argument does not match!
            continue
          }
          for (let i = byteLength - 1; i >= 0; i--) {
            data.push((code >> (i * 8)) & 0xFF)
          }
          if (controlCode.args) {
            const argVal = parseInt(match.argument)
            for (let i = controlCode.args - 1; i >= 0; i--) {
              data.push((argVal >> (i * 8)) & 0xFF)
            }
          }
          step(match.length)
          found = true
          break
        }
        if (found) {
          continue
        }
      }

      let charCode = text.charCodeAt()
      if (japanese) {
        if (charCode === 0x20) {
          charCode = 0x3000 // Convert regular space
        } else if (charCode >= 0x21 && charCode <= 0x007E) {
          charCode = charCode + 0xFF00 - 0x20 // Convert basic latin characters
        }
      }

      let charData = japanese ? unicodeCharToSJIS(String.fromCharCode(charCode)) : charCode

      data = data.concat(charData)
      step(1)
    }

    for (let i = byteLength - 1; i >= 0; i--) {
      data.push((eom >> (i * 8)) & 0xFF)
    }

    let pad = data.length % 4
    if (pad !== 0) {
      data.length += 4 - pad
    }
    return Buffer.from(data)
  }

  bufferToText (msgBuffer, japanese) {
    let byteLength = japanese ? 2 : 1
    let eom = japanese ? endOfMessageJ : endOfMessage
    let codes = japanese ? controlCodesJ : controlCodes

    let msg = ''
    msgBuffer = Buffer.concat([msgBuffer, Buffer.alloc(4)]) // We add padding at the end to prevent readUInt32BE from overflowing
    for (let i = 0, l = msgBuffer.length - 4; i < l; i += byteLength) {
      const val = msgBuffer.readUIntBE(i, byteLength)
      if (val === eom) {
        break
      }
      if (val in codes) {
        let controlCode = codes[val]
        let argLen = controlCode.args || 0
        if (typeof controlCode.toMarkup === 'string') {
          msg += controlCode.toMarkup
        } else if (typeof controlCode.toMarkup === 'function') {
          msg += controlCode.toMarkup(msgBuffer.readUIntBE(i + byteLength, argLen))
        } else {
          let arg = argLen ? `=0x${msgBuffer.readUIntBE(i + byteLength, argLen).toString(16).toUpperCase()}` : ''
          msg += `[${controlCode.tag}${arg}]`
        }
        i += argLen
      } else {
        if (japanese) {
          msg += SJIStoUnicodeChar(val)
        } else {
          msg += String.fromCharCode(val)
        }
      }
    }
    return msg
  }

  bufferToHtml (msgBuffer, plaintext = false, japanese) {
    let byteLength = japanese ? 2 : 1
    let eom = japanese ? endOfMessageJ : endOfMessage
    let codes = japanese ? controlCodesJ : controlCodes

    let end = false
    let msg = ''
    const state = {
      color: false,
      getColor: (c, type = 0) => {
        return this.getColor(c, type)
      },
      end: () => {
        end = true
      }
    }
    msgBuffer = Buffer.concat([msgBuffer, Buffer.alloc(4)]) // We add padding at the end to prevent readUInt32BE from overflowing
    for (let i = 0, l = msgBuffer.length - 4; i < l; i += byteLength) {
      const val = msgBuffer.readUIntBE(i, byteLength)
      if (val === eom) {
        break
      }
      if (val in codes) {
        let controlCode = codes[val]
        let argLen = controlCode.args || 0
        if (!plaintext && 'toHtml' in controlCode) {
          if (typeof controlCode.toHtml === 'string') {
            msg += controlCode.toHtml
          } else if (typeof controlCode.toHtml === 'function') {
            msg += controlCode.toHtml(state, msgBuffer.readUIntBE(i + byteLength, argLen)) || ''
            if (end) {
              break
            }
          }
        } else if ('toText' in controlCode) {
          if (typeof controlCode.toText === 'string') {
            msg += controlCode.toText
          } else if (typeof controlCode.toText === 'function') {
            msg += controlCode.toText(state, msgBuffer.readUIntBE(i + byteLength, argLen)) || ''
            if (end) {
              break
            }
          }
        }
        i += argLen
      } else {
        if (japanese) {
          msg += SJIStoUnicodeChar(val)
        } else {
          msg += String.fromCharCode(val)
        }
      }
    }
    if (state.color) {
      msg += '</span>'
    }
    return msg
  }
  // 801D8884 text location
  // 0x801C7DE4 Color table? Only seems to include green...?
  getColor (id = 0, type) {
    id &= 0xF // 0x800D90E0 (NTSC-U 1.0) / 0x800DB304 (NTSC-J 1.0)
    if (
      id > 0x7 || // 0x800D6BB4 (NTSC 1.0)
      id === 0x0 // jump at 800D6BC8 (NTSC 1.0) from jump table entry
    ) {
      if (type === 0x5) { // 0x800D6E24 (NTSC 1.0)
        return '#000000' // 0x800D6E2C (NTSC 1.0)
      }
      return '#FFFFFF' // 0x800D6E20 (NTSC 1.0)
    }
    let colors
    if (type === 1) { // Wooden background
      colors = [
        '#FF7800',
        '#46FF50', // 0x801C7DE6 (NTSC 1.0)
        '#506EFF',
        '#5AB4FF',
        '#D264FF',
        '#FFFF1E',
        '#000000' // 0x800D6DF8 (NTSC 1.0)
      ]
    } else {
      colors = [
        '#FF3C3C',
        '#46FF50', // 0x801C7DEC (NTSC 1.0)
        '#505AFF',
        '#64B4FF',
        '#FF96B4',
        '#E1FF32',
        '#000000' // 0x800D6DF8 (NTSC 1.0)
      ]
    }
    return colors[id - 1]
  }

  getBoxInfo (msgBuffer, prevInfo, japanese) {
    let byteLength = japanese ? 2 : 1
    let eom = japanese ? endOfMessageJ : endOfMessage
    let codes = japanese ? controlCodesJ : controlCodes

    let end = false
    let boxBreak = false
    const state = {
      rows: 1,
      hideButton: false,
      icon: null,
      choiceMode: null,
      nextMessage: null,
      end: () => {
        end = true
      },
      break: () => {
        end = true
        boxBreak = true
      }
    }
    if (prevInfo) {
      state.icon = prevInfo.icon
    }
    let i = 0
    msgBuffer = Buffer.concat([msgBuffer, Buffer.alloc(4)])
    while (i < msgBuffer.length - 4) {
      let val = msgBuffer.readUIntBE(i, byteLength)
      if (val === eom) {
        break
      } else if (val in codes) {
        let controlCode = codes[val]
        let argLen = controlCode.args || 0
        if ('info' in controlCode) {
          controlCode.info(state, msgBuffer.readUIntBE(i + byteLength, argLen))
          if (end) {
            if (boxBreak) {
              state.boxBreak = i + argLen + byteLength
            }
            break
          }
        }
        i += argLen
      }
      i += byteLength
    }
    return state
  }

  async renderMessage (buffer, type = 0, position = 0, japanese) {
    console.groupCollapsed('renderMessage')
    console.time('renderMessage')
    let boxes = []
    let lastBox = false
    let boxBreak = 0
    let i = 0
    let prevInfo = null
    while ((lastBox !== true) && (i < 50)) { // safeguard, I don't want shit crashing when developing
      let buff = buffer.slice(boxBreak)
      let info = this.getBoxInfo(buff, prevInfo, japanese)
      console.log('info', info)
      if (info.boxBreak) {
        boxBreak += info.boxBreak
      } else {
        lastBox = true
      }
      let box = await this._renderBox(buff, type, position, info, japanese)
      boxes.push(box)
      if (info.nextMessage != null) {
        boxes.push(info.nextMessage)
        break
      }
      prevInfo = info
      i++
    }
    console.timeEnd('renderMessage')
    console.groupEnd()
    return boxes
  }

  // Internal function used by renderMessage
  async _renderBox (buffer, type, position, info, japanese) {
    const byteLength = japanese ? 2 : 1
    const eom = japanese ? endOfMessageJ : endOfMessage
    const codes = japanese ? controlCodesJ : controlCodes

    if (!(type >= 0) || !(type <= 0xF)) {
      type = 0
    }
    if (position > 0xF) {
      position = 0
    }

    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 240
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // TODO: Cache images that are used to speed up render?
    const _img = new Image()
    const loadImage = src => {
      return new Promise((resolve, reject) => {
        _img.src = src
        _img.onload = () => {
          resolve(_img)
        }
      })
    }

    const printCharacter = async char => {
      if (!japanese) {
        char -= 0x20
      }
      let texture = this.getCharacter(char, color, japanese)
      if (!texture) {
        console.warn(`Could not print character ${char}, texture does not exist`)
        return
      }
      if (japanese) {
        if (char === 0x8145) {
          state.x -= 0x3 // 0x800D8C9C (NTSC 1.0)
          console.log(`Character 0x${char.toString(16).toUpperCase()}, stepping back 0x3 pixels before rendering`)
        }
        if (char === 0x8148 || char === 0x8149 || char === 0x814F || char === 0x8250) {
          state.x -= 0x2 // 0x800D8CB4 (NTSC 1.0)
          console.log(`Character 0x${char.toString(16).toUpperCase()}, stepping back 0x2 pixels before rendering`)
        }
        if (char === 0x8169 || char === 0x8175) {
          state.x -= 0x6 // 0x800D8C84 (NTSC 1.0)
          console.log(`Character 0x${char.toString(16).toUpperCase()}, stepping back 0x6 pixels before rendering`)
        }
      }
      // TODO: Space character should not be rendered and is hardcoded to 0x06
      // 800D9120 in NTSC 1.0
      // 801088D8 in Debug (0xEBA78 in code)
      if (type !== 5) {
        let textureBg = this.getCharacter(char, this.getColor(0x7, type), japanese)
        if (textureBg) {
          ctx.drawImage(
            await loadImage(textureBg),
            state.x + 1,
            state.y + 1,
            16 * fontScale,
            16 * fontScale
          )
        }
      }
      ctx.drawImage(
        await loadImage(texture),
        state.x,
        state.y,
        16 * fontScale,
        16 * fontScale
      )
      if (japanese) {
        if (char === 0x8140) { // 0x800D7CE8 (NTSC 1.0)
          state.x += 0x6 // 0x800D7DBC (NTSC 1.0
          console.log(`Character 0x${char.toString(16).toUpperCase()}, step 0x6 pixels`)
        } else if (
          char === 0x8196 || // 0x800D8D70 (NTSC 1.0)
          char === 0x8194 || // 0x800D8D8C (NTSC 1.0)
          char === 0x814F
        ) {
          state.x += 0x9 // 0x800D8E10 (NTSC 1.0)
          console.log(`Character 0x${char.toString(16).toUpperCase()}, step 0x9 pixels`)
        } else if (char === 0x8145) {
          state.x += 0xA // 0x800D8E24 (NTSC 1.0)
          console.log(`Character 0x${char.toString(16).toUpperCase()}, step 0xA pixels`)
        } else if (char === 0x8144) {
          state.x += 0x3 // 0x800D8DD4 (NTSC 1.0)
          console.log(`Character 0x${char.toString(16).toUpperCase()}, step 0x3 pixels`)
        } else if (char === 0x8176 || char === 0x816A) {
          state.x += 0x5 // 0x800D8DE8 (NTSC 1.0)
          console.log(`Character 0x${char.toString(16).toUpperCase()}, step 0x5 pixels`)
        } else if (char === 0x8141 || char === 0x8142 || char === 0x8168) {
          state.x += 0x7 // 0x800D8DFC (NTSC 1.0)
          console.log(`Character 0x${char.toString(16).toUpperCase()}, step 0x7 pixels`)
        } else {
          state.x += Math.floor(16 * fontScale)
        }
      } else {
        console.log(char, this.characterWidth[char], Math.floor(this.characterWidth[char] * fontScale))
        state.x += Math.floor(this.characterWidth[char] * fontScale)
      }
    }

    const printText = async text => {
      for (let char of text) {
        console.log('printText ', char)
        let charCode
        if (japanese) {
          let charData = unicodeCharToSJIS(char)
          charCode = (charData[0] << 8) + charData[1]
        } else {
          charCode = char.charCodeAt()
        }
        await printCharacter(charCode)
      }
    }

    const printIcon = async icon => {
      console.log(`Printing icon ${info.icon} (${icon})`)
      let asset = this.assets.icons[info.icon]
      if (asset) {
        let img = await loadImage(asset)
        if (info.icon < 0x66) { // 0x800DA1AC (NTSC 1.0)
          let iconOffsets = [
            0x0036, // 0x80113180 (NSTC 1.0)
            0x004A // 0x80113182 (NSTC 1.0)
          ]
          let iconOffset = iconOffsets[japanese ? 0 : 1] // 0x800DA1D8 (NSTC 1.0)
          let offset = xBase - iconOffset // 0x800DA1E8 (NSTC 1.0)
          ctx.drawImage(
            img,
            state.x + offset,
            yBase + 0x10,
            32,
            32
          )
        } else {
          let iconOffsets = [
            0x0032, // 0x80113184 (NSTC 1.0)
            0x0048 // 0x80113186 (NSTC 1.0)
          ]
          let iconOffset = iconOffsets[japanese ? 0 : 1] // 0x800DA264 (NSTC 1.0)
          let offset = xBase - iconOffset // 0x800DA274 (NSTC 1.0)
          ctx.drawImage(
            img,
            state.x + offset,
            yBase + 0x14,
            24, 24
          )
        }
      }
      state.x += 0x20
    }

    let xBase
    let fontScale
    if (japanese) {
      xBase = 0x32
      fontScale = 0.88
    } else {
      xBase = 0x41
      fontScale = 0.75
    }

    // The game is actually doing various checks for offscreen Y position
    // instead of just doing an AND 0xFF on it like me
    // As a result the combination Type E Position 2 isn't emulated correctly
    // This is also why the continue button isn't visible for type 8
    // Table is at 0x80113254 (NTSC 1.0)
    let yBase = dialogPositions[type] & 0xFF // 0x800E0DE8 (NTSC 1.0)
    if (type !== 0x4) {
      if (position === 1) {
        yBase = dialogPositions[type + ((position) * 6)] & 0xFF
      }
      if (position === 2) {
        yBase = dialogPositions[type + ((position) * 6)] & 0xFF
      }
    }

    let color = this.getColor(0, type)
    if (type >= 0 && type <= 3) { // Draw background for type 0-3
      let img = await loadImage(this.assets.backgrounds[type])
      ctx.drawImage(img, 34, yBase, 128, 64)
      ctx.save() // Save the current state
      ctx.scale(-1, 1)
      ctx.drawImage(img, -320 + 30, yBase, 128, 64)
      ctx.restore() // load the saved state
    }

    let end = false
    let state = {
      row: 0,
      x: xBase,
      y: yBase,
      setColor: (c) => {
        color = this.getColor(c, type)
      },
      icon: printIcon,
      write: printText,
      end: () => {
        end = true
      },
      lineBreak: () => {
        state.row++
        state.x = xBase
        if (japanese) {
          state.y += 18
          if (info.icon != null) {
            state.x += 0x20
          } else if (info.choiceMode != null) {
            state.x += 0x20
          }
        } else {
          state.y += 12
          if (info.icon != null) {
            state.x += 0x20
          } else {
            if (info.choiceMode === 0 && state.row > 1) {
              state.x += 0x20
            } else if (info.choiceMode === 1) {
              state.x += 0x20
            }
          }
        }
      }
    }

    if (japanese) {
      if (info.choiceMode === 1) {
        state.x += 0x20
      }
      state.y += 0x06 // 0x800DA43C (NTSC 1.0)
      if (type !== 0x4) {
        if (info.rows === 1) {
          state.y = yBase + 0x16 // 0x800DA464 (NTSC 1.0)
        } else if (info.rows === 2) {
          state.y = yBase + 0x0E // 0x800DA480 (NTSC 1.0)
        }
      } else {
        state.y += 0x08 // TODO: Check how this works on Japanese
      }
    } else {
      // We're replicating the math at 0x80109C44 (DEBUG)
      if (type !== 0x4) {
        if (info.rows === 1) {
          state.y += 0x1A
        } else if (info.rows === 2) {
          state.y += 0x14
        } else if (info.rows === 3) {
          state.y += 0x10
        } else { // 0x80109CB8 (DEBUG) branches here when more than 3 rows
          state.y += 0x08
        }
        // Continues at 0x80109CD4 (DEBUG)
      } else { // 0x80109C68 (DEBUG) checks for type 4
        state.y += 0x08
      }
    }

    for (let i = 0, l = buffer.length; i < l; i += byteLength) {
      const val = buffer.readUIntBE(i, byteLength)
      if (val === eom) {
        break
      } else if (val in codes) {
        let controlCode = codes[val]
        let argLen = controlCode.args || 0
        if ('render' in controlCode) {
          if (controlCode.render === true) {
            await printCharacter(val)
          } else if (typeof controlCode.render === 'string') {
            await printText(controlCode.render)
          } else if (typeof controlCode.render === 'function') {
            await controlCode.render(state, buffer.readUIntBE(i + byteLength, argLen))
            if (end) {
              break
            }
          }
        }
        i += argLen
      } else {
        await printCharacter(val)
      }
    }

    if (info.choiceMode !== null) {
      if (japanese) {
        let arrowPositions = [
          0x07, // 0x800E0E68 (NTSC 1.0)
          0x19, // 0x800E0E78 (NTSC 1.0)
          0x2B // 0x800E0E88 (NTSC 1.0)
        ]
        for (let i = 1 - info.choiceMode; i < 3; i++) {
          console.log('Drawing choice arrow for row', i)
          ctx.drawImage(
            await loadImage(this.assets.buttons[2]),
            0x30, // 0x800E20EC (NTSC 1.0)
            yBase + arrowPositions[i],
            16 * fontScale,
            16 * fontScale
          )
        }
      } else {
        let i
        if (info.choiceMode === 0) {
          i = 2
        } else {
          i = 1
        }
        while (i < 4) {
          ctx.drawImage(
            await loadImage(this.assets.buttons[2]),
            0x30,
            yBase + 8 + (12 * i),
            16 * fontScale,
            16 * fontScale
          )
          i++
        }
      }
    }

    if (!info.hideButton) {
      let img
      if ((info.boxBreak != null) || (info.nextMessage != null)) {
        img = await loadImage(this.assets.buttons[0])
      } else {
        img = await loadImage(this.assets.buttons[1])
      }
      ctx.drawImage(
        img,
        158,
        (yBase + dialogPositions[18 + type]) & 0xFF,
        16 * fontScale,
        16 * fontScale
      )
    }

    return canvas.toDataURL()
  }
}

export default new MessageEditorParser()
