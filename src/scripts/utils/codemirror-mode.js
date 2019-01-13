import CodeMirror from 'codemirror'

CodeMirror.defineMode('mudora', function (config) {
  var settings, last

  settings = {
    bbCodeUnaryTags: 'i A B C L R Z \\^ v < > STICK + TARGET br stay event UNK_0D name ocarina UNK_11 marathon race points skulltulas noskip ch2 ch3 fish time color step fade icon speed record next sound bg'
  }

  if (config.hasOwnProperty('bbCodeUnaryTags')) {
    settings.bbCodeUnaryTags = config.bbCodeUnaryTags
  }

  var helpers = {
    cont: function (style, lastType) {
      last = lastType
      return style
    },
    escapeRegEx: function (s) {
      return s.replace(/([\:\-\)\(\*\+\?\[\]])/g, '\\$1')
    }
  }

  var regs = {
    unaryTags: new RegExp('^(?:' + helpers.escapeRegEx(settings.bbCodeUnaryTags).split(' ').join('|') + ')(\\]|\\=|$)', 'i')
  }

  var parsers = {
    tokenizer: function (stream, state) {
      if (stream.eatSpace()) return null
      // Highlight Violet Evergarden
      if (stream.match('Violet Evergarden', true, true)) {
        return helpers.cont('atom')
      } else if (stream.match('ヴァイオレット・エヴァーガーデン', true, true)) {
        return helpers.cont('atom')
      }
      // Highlight CloudMax
      if (stream.match('CloudMax', true, true)) {
        return helpers.cont('variable-2')
      } else if (stream.match('クラウドマックス', true, true)) {
        return helpers.cont('variable-2')
      }
      // Hylian
      if (stream.match(/\{([aiueokshtcnfmyrw]{1,3}|[\u3041-\u309F])\}/, true)) {
        return helpers.cont('string')
      }
      // Step into tag
      if (stream.match('[', true)) {
        state.tokenize = parsers.mudora
        return helpers.cont('tag', 'startTag')
      }
      // Next
      stream.next()
      return null
    },

    mudora: function (stream, state) {
      if (stream.match(']', true)) {
        state.tokenize = parsers.tokenizer
        return helpers.cont('tag', null)
      }

      if (stream.match('[', true)) {
        return helpers.cont('tag', 'startTag')
      }

      var ch = stream.next()

      if (state.last === 'equals') {
        stream.eatWhile(/[xa-fA-F0-9]/)
        return helpers.cont('number', 'number')
      } else if (/=/.test(ch)) {
        return helpers.cont('attribute', 'equals')
      }

      var str = ''
      if (ch !== '/') {
        str += ch
      }
      var c = null
      while ((c = stream.eat(/[a-zA-Z0-9_+<>^]/))) {
        str += c
      }
      if (regs.unaryTags.test(str)) {
        return helpers.cont('property', 'property')
      }
      if (/\s/.test(ch)) {
        return null
      }
      return helpers.cont('tag', 'tag')
    }
  }

  return {
    startState: function () {
      return {
        tokenize: parsers.tokenizer,
        mode: 'mudora',
        last: null
      }
    },
    token: function (stream, state) {
      var style = state.tokenize(stream, state)
      state.last = last
      return style
    },
    electricChars: ''
  }
})

// vim: et ts=2 sts=2 sw=2
