export function pad (pad, str, padRight) {
  if (typeof str === 'undefined') {
    return pad
  }
  if (padRight) {
    return (str + pad).substring(0, pad.length)
  } else {
    return (pad + str).slice(-pad.length)
  }
}

export function hexId (id) {
  return `0x${pad(Array(5).join('0'), id.toString(16)).toUpperCase()}`
}

export function japaneseCharToInternational (char) {
  let charCode = char.charCodeAt()
  if (charCode === 0x3000) {
    charCode = 0x20 // Convert regular space
  } else if (charCode >= 0xFF01 && charCode <= 0xFF7E) {
    charCode = charCode - 0xFF00 + 0x20 // Convert basic latin characters
  }
  return String.fromCharCode(charCode)
}

export function japaneseStringToInternational (str) {
  let result = ''
  for (let char of str) {
    result += japaneseCharToInternational(char)
  }
  return result
}
