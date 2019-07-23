const fs = require('fs')
const markup = require('chalk')
const prompts = require('prompts')
let settings = require('./settings') || null

if (!settings) {
  console.log(markup.bold.red('settings.js file does not exist\nStart Setting Proc...'))
  setSettings()
}

proc(() => { process.exit(0) })

async function proc (cb) {
  const res = await prompts({
    type: 'autocomplete',
    name: 'command',
    message: settings.locale === 'KR' ? '실행할 명령어를 입력해주세요' : 'Enter Command',
    initial: 1,
    limit: 1,
    choices: [
      { title: 'startServer' },
      { title: 'addDB' },
      { title: 'deleteDB' },
      { title: 'settings' }
    ]
  })

  switch (res.command) {
    case 'settings':
      await setSettings()
      break

    case 'startServer':
      if (check()) {
        console.log(markup.blue(settings.locale === 'KR' ? '시작하시러면 "node start"를 입력하세요!' : 'Type "node start" to start server'))
      } else {
        console.log(markup.red('Type "settings" first (settings를 먼저 실행해 주세요)'))
      }
      break

    default:
      break
  }
  cb()
}

function check () {
  if (!fs.existsSync('./settings.js')) {
    console.log('* settings.js 파일이 없습니다')
    return false
  }

  if (!settings.PORT || typeof (settings.PORT) !== 'number' || settings.PORT > 99999) {
    console.log('* PORT설정이 없거나 잘못되었습니다')
    return false
  }

  if (!settings.locale || typeof (settings.locale) !== 'string' || settings.locale.length < 2) {
    console.log('* locale설정이 없거나 잘못되었습니다')
    return false
  }

  if (settings.useCors === undefined || typeof (settings.useCors) !== 'boolean') {
    console.log('* useCors설정이 없거나 잘못되었습니다')
    return false
  }

  if (!settings.adminSettings || typeof (settings.adminSettings) !== 'object') {
    console.log('adminSettings설정이 없거나 잘못되었습니다')
    return false
  }

  if (!settings.adminSettings.adminID || typeof (settings.adminSettings.adminID) !== 'string') {
    console.log('adminSettings에 adminID설정이 없거나 잘못되었습니다')
    return false
  }

  if (!settings.adminSettings.adminPW || typeof (settings.adminSettings.adminPW) !== 'string' || settings.adminSettings.adminPW.length < 64) {
    console.log('adminSettings에 adminPW설정이 없거나 잘못되었습니다 (직접 수정하지 마세요)')
    return false
  }

  return true
}

async function setSettings () {
  const locale = await prompts({
    type: 'select',
    name: 'locale',
    message: 'Select Your Language',
    choices: [
      { title: 'English', value: 'EN' },
      { title: '한국어', value: 'KR' }
    ]
  })

  settings = {}
  settings.locale = locale.locale

  fs.writeFileSync('./settings.js', 'module.exports = ' + JSON.stringify(settings))

  const selectSetting = await prompts([
    {
      type: 'number',
      name: 'PORT',
      message: settings.locale === 'KR' ? '서버를 호스팅할때 필요한 접속 포트를 입력해주세요' : 'Please Enter Connection Port',
      validate: (v) => v > 99999 ? (settings.locale === 'KR' ? '포트는 5글자 이하여야 합니다' : 'Port cannot be longer than 99999') : true
    },
    {
      type: 'select',
      name: 'useCors',
      message: settings.locale === 'KR' ? '서버에 사용할 알고리즘을 선택해주세요' : 'Please Select Server algorithm',
      choices: [
        { title: settings.locale === 'KR' ? 'Cors를 사용합니다 (다른사이트에서 이 서버를 사용하는것을 허용합니다)' : 'With Cors (Allow connection from anothor site)', value: 'yes' },
        { title: settings.locale === 'KR' ? 'express만을 사용합니다 (다른사이트에서 이 서버를 사용하는것을 방지합니다)' : 'Without Cors (disallow connection from anothor site)', value: 'no' }
      ]
    }
  ])

  switch (selectSetting.useCors) {
    case 'yes':
      selectSetting.useCors = true
      break

    default:
      selectSetting.useCors = false
      break
  }

  selectSetting.adminSettings = await prompts([
    {
      type: 'text',
      name: 'adminID',
      message: settings.locale === 'KR' ? '관리자의 아이디를 설정합니다' : 'Please Enter Admin\'s ID'
    },
    {
      type: 'password',
      name: 'adminPW',
      message: settings.locale === 'KR' ? '관리자의 비밀번호를 설정합니다' : 'Please Enter Admin\'s PW'
    }
  ])

  selectSetting.adminSettings.adminPW = sha256(selectSetting.adminSettings.adminPW)
  selectSetting.locale = locale.locale
  settings = selectSetting
  fs.writeFileSync('./settings.js', 'module.exports = ' + JSON.stringify(settings))
}

function sha256 (ascii) {
  function rightRotate (value, amount) {
    return (value >>> amount) | (value << (32 - amount))
  }

  var mathPow = Math.pow
  var maxWord = mathPow(2, 32)
  var lengthProperty = 'length'
  var i, j // Used as a counter across the whole file
  var result = ''

  var words = []
  var asciiBitLength = ascii[lengthProperty] * 8

  //* caching results is optional - remove/add slash from front of this line to toggle
  // Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
  // (we actually calculate the first 64, but extra values are just ignored)
  var hash = sha256.h = sha256.h || []
  // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
  var k = sha256.k = sha256.k || []
  var primeCounter = k[lengthProperty]

  var isComposite = {}
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0
    }
  }

  ascii += '\x80' // Append Ƈ' bit (plus zero padding)
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00' // More zero padding
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i)
    if (j >> 8) return // ASCII check: only accept characters in range 0-255
    words[i >> 2] |= j << ((3 - i) % 4) * 8
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0)
  words[words[lengthProperty]] = (asciiBitLength)

  // process each chunk
  for (j = 0; j < words[lengthProperty];) {
    var w = words.slice(j, j += 16) // The message is expanded into 64 words as part of the iteration
    var oldHash = hash
    // This is now the undefinedworking hash", often labelled as variables a...g
    // (we have to truncate as well, otherwise extra entries at the end accumulate
    hash = hash.slice(0, 8)

    for (i = 0; i < 64; i++) {
      // Expand the message into 64 words
      // Used below if
      var w15 = w[i - 15]; var w2 = w[i - 2]

      // Iterate
      var a = hash[0]; var e = hash[4]
      var temp1 = hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + // S1
        ((e & hash[5]) ^ ((~e) & hash[6])) + // ch
        k[i] +
      // Expand the message schedule if needed
        (w[i] = (i < 16) ? w[i] : (
          w[i - 16] +
            (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + // s0
            w[i - 7] +
            (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
        ) | 0
        )
      // This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
      var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + // S0
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])) // maj

      hash = [(temp1 + temp2) | 0].concat(hash) // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
      hash[4] = (hash[4] + temp1) | 0
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      var b = (hash[i] >> (j * 8)) & 255
      result += ((b < 16) ? 0 : '') + b.toString(16)
    }
  }
  return result
}
