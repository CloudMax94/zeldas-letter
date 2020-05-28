export const endOfMessage = 0x02

// TODO: Check if 0x0B skips remaining text / hide button
// FIXME add accented characters 0x7F-0x9E!
export const controlCodes = {
  0x01: {
    toBinary: (str) => {
      if (str.charCodeAt() === 0xA) {
        return [1, [0x1]]
      }
    },
    render: (state) => state.lineBreak(),
    toText: '\n',
    toMarkup: '\n',
    info: (state) => {
      state.widths[state.rows] = 0
      state.rows++
    }
  },
  0x04: {
    tag: 'br',
    render: (state) => state.end(),
    toHtml: '<hr>',
    toText: ' ',
    info: (state) => state.break()
  },
  0x08: {
    tag: 'i'
  },
  0x09: {
    tag: '/i'
  },
  0x0A: {
    tag: 'stay',
    render: (state) => state.end(),
    toHtml: (state) => state.end(),
    info: (state, argument) => {
      state.hideButton = true
      state.end()
    }
  },
  0x0B: {
    tag: 'event'
  },
  0x0F: {
    tag: 'name',
    render: 'Link',
    toText: 'Link'
  },
  0x10: {
    tag: 'ocarina',
    render: (state) => state.end(),
    toHtml: (state) => state.end(),
    info: (state) => {
      state.hideButton = true
      state.end()
    }
  },
  0x16: {
    tag: 'marathon',
    render: '00"00"',
    toText: '00"00"'
  },
  0x17: {
    tag: 'race',
    render: '00"00"',
    toText: '00"00"'
  },
  0x18: {
    tag: 'points',
    render: '1000',
    toText: '1000'
  },
  0x19: {
    tag: 'skulltulas',
    render: '100',
    toText: '100'
  },
  0x1A: {
    tag: 'noskip'
  },
  0x1B: {
    tag: 'ch2',
    info: (state) => {
      state.hideButton = true
      state.choiceMode = 0
    }
  },
  0x1C: {
    tag: 'ch3',
    info: (state) => {
      state.hideButton = true
      state.choiceMode = 1
    }
  },
  0x1D: {
    tag: 'fish',
    render: '10',
    toText: '10'
  },
  0x1F: {
    tag: 'time',
    render: '10:00',
    toText: '10:00'
  },
  0x05: {
    args: 1,
    toBinary: (str) => {
      if (str.charAt() === '[') {
        // Check for closing tag
        let close = '[/color]'
        if (str.slice(0, close.length) === close) {
          return [close.length, [0x05, 0x40]]
        }
        // Check if it matches the bracket format
        let regex = /^\[color=((0x)?[0-9a-fA-F]+)\]/
        let match = str.match(regex)
        if (match) {
          let color = parseInt(match[1])
          if (Number.isNaN(color)) {
            color = 0
          }
          return [match[0].length, [0x05, color & 0xFF]]
        }
      }
    },
    toMarkup: (argument) => {
      if ((argument & 0xF) === 0) {
        return `[/color]`
      }
      return `[color=0x${argument.toString(16).toUpperCase()}]`
    },
    render: (state, argument) => state.setColor(argument),
    toHtml: (state, argument) => {
      let ret = state.color ? '</span>' : ''
      state.color = true
      return ret + `<span style='color:${state.getColor(argument)}'>`
    }
  },
  0x06: {
    tag: 'step',
    args: 1,
    render: (state, argument) => { state.x += argument & 0xFF },
    info: (state, argument) => { state.widths[state.rows - 1] += argument & 0xFF },
    toText: ' '
  },
  0x0C: {
    tag: 'br',
    args: 1,
    render: (state) => state.end(),
    toHtml: '<hr>',
    toText: ' ',
    info: (state) => {
      state.hideButton = true
      state.break()
    }
  },
  0x0E: {
    tag: 'fade',
    args: 1,
    render: (state) => state.end(),
    toHtml: (state) => state.end(),
    info: (state) => {
      state.hideButton = true
      state.end()
    }
  },
  0x13: {
    tag: 'icon',
    args: 1,
    render: (state, argument) => state.icon(argument),
    info: (state, argument) => {
      state.icon = argument
      state.widths[state.rows - 1] += 32
    }
  },
  0x14: {
    tag: 'speed',
    args: 1
  },
  0x1E: {
    tag: 'record',
    args: 1,
    render: (state, argument) => {
      switch (argument) {
        case 0: return state.write('1000')
        case 1: return state.write('100')
        case 2: return state.write('10')
        case 3: return state.write('00"00"')
        case 4: return state.write('00"00"')
        case 6: return state.write('00"00"')
      }
    },
    toText: (state, argument) => {
      switch (argument) {
        case 0: return '1000'
        case 1: return '100'
        case 2: return '10'
        case 3: return '00"00"'
        case 4: return '00"00"'
        case 6: return '00"00"'
      }
    }
  },
  0x07: {
    tag: 'next',
    args: 2,
    render: (state) => state.end(),
    toHtml: (state) => state.end(),
    info: (state, argument) => {
      state.nextMessage = argument
      state.end()
    }
  },
  0x12: {
    tag: 'sound',
    args: 2
  },
  0x15: {
    tag: 'bg',
    args: 3
  },
  // ¥ is stored as 0x5C which normally would be a backslash
  0x5C: {
    toBinary: (str) => {
      if (str.charCodeAt() === 0x5C) {
        return [1, []] // Prevent backslash characters from being saved
      } else if (str.charAt() === '¥') {
        return [1, [0x5C]]
      }
    },
    toMarkup: '¥',
    toText: '¥',
    render: true
  }
}

// TODO, check if something is up with Ë. It has a width of 6, which doesn't fit. (Ï & ï is also 6, which makes more sense)
let accentedCharacters = [
  '‾', 'À', 'Î', 'Â', 'Ä', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ï', 'Ô', 'Ö', 'Ù', 'Û', 'Ü',
  'ß', 'à', 'á', 'â', 'ä', 'ç', 'è', 'é', 'ê', 'ë', 'ï', 'ô', 'ö', 'ù', 'û', 'ü'
]
let i = 0x7F
for (let char of accentedCharacters) {
  let charCode = i
  controlCodes[charCode] = {
    toBinary: (str) => {
      if (str.charCodeAt() === charCode) {
        return [1, []] // Prevent actual unicode character from being saved
      } else if (str.charAt() === char) {
        return [1, [charCode]]
      }
    },
    toMarkup: char,
    toText: char,
    render: true
  }
  i++
}

let specialCharacters = [
  'A', 'B', 'C', 'L', 'R', 'Z',
  '^', 'v', '<', '>', 'TARGET', 'STICK', '+'
]
i = 0x9F
for (let char of specialCharacters) {
  controlCodes[i] = {
    tag: char,
    render: true,
    toText: `[${char}]`
  }
  i++
}
