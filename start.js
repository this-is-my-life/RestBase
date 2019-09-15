const fs = require('fs')
const ejs = require('ejs')
const cors = require('cors')
const uuid = require('uuid/v4')
const markup = require('chalk')
const express = require('express')
const jsontoxml = require('jsontoxml')
const settings = require('./settings') || null

if (!settings) console.log('"node manage" first')

const app = express()
const count = {
  user: 0,
  admin: 0,
  get: 0,
  post: 0,
  put: 0,
  delete: 0
}

if (settings.useCors) {
  app.use(cors())
}

app.use(express.json())

if (!settings.permission) {
  settings.permission = {}
}

if (!fs.existsSync('./DB/')) {
  fs.mkdirSync('./DB/')
}

setInterval(() => {
  fs.readdirSync('./DB/').forEach((file) => {
    if (!settings.permission[file]) {
      settings.permission[file] = {
        get: true,
        post: false,
        put: false,
        delete: false
      }
    }
  })
}, 100)

fs.writeFileSync('./settings.js', 'module.exports = ' + JSON.stringify(settings))

fs.writeFileSync('./auth/keys.json', '[]')
const keys = require('./auth/keys.json')

app.get('/admin', (req, res) => {
  count.admin++
  console.log(markup.cyan.underline('REQUEST') + ' ' + markup.cyan(req.ip + ' ' + req.protocol + ' ' + req.path))
  const temp = fs.readFileSync('./page/admin_' + settings.locale + '.html')
  res.send(temp.toString('utf-8'))
})

app.get('/admin/:locate', (req, res) => {
  count.admin++
  console.log(markup.cyan.underline('REQUEST') + ' ' + markup.cyan(req.ip + ' ' + req.protocol + ' ' + req.path))
  switch (req.params.locate) {
    case 'verity':
      if (!req.query.id || !req.query.pw) {
        res.redirect('/admin')
      } else if (settings.adminSettings.adminID === req.query.id && settings.adminSettings.adminPW === req.query.pw) {
        console.log(markup.yellow.underline('VERITY') + ' ' + markup.yellow('Requested ID: ' + req.query.id + ' | Requested PW Hash: ' + req.query.pw))
        console.log(markup.yellow.underline('VERITY') + ' ' + markup.yellow('Stored ID: ' + settings.adminSettings.adminID + ' | Stored PW Hash: ' + settings.adminSettings.adminPW))

        const authToken = uuid()
        keys[keys.length] = authToken
        console.log(markup.magenta.underline('AUTHGEN') + ' ' + markup.magenta('Auth UUID: ' + authToken))
        res.redirect('/admin/dashboard?auth=' + authToken)
      } else {
        res.redirect('/admin')
      }
      break

    case 'setPermission':
      if (keys.includes(req.query.auth) && req.query.key && req.query.value) {
        console.log(markup.green.underline('AUTH') + ' ' + markup.green('Auth UUID: ' + req.query.auth))
        const keyArgs = req.query.key.split(',')
        settings.permission[keyArgs[0]][keyArgs[1]] = JSON.parse(req.query.value)
        fs.writeFileSync('./settings.js', 'module.exports = ' + JSON.stringify(settings))
        res.sendStatus(200)
      } else {
        res.sendStatus(406)
      }
      break

    case 'delete':
      if (keys.includes(req.query.auth) && req.query.key) {
        console.log(markup.green.underline('AUTH') + ' ' + markup.green('Auth UUID: ' + req.query.auth))
        fs.unlinkSync('./DB/' + req.query.key + '.json')
        res.sendStatus(200)
      } else {
        res.sendStatus(406)
      }
      break

    case 'add':
      if (keys.includes(req.query.auth) && req.query.key) {
        console.log(markup.green.underline('AUTH') + ' ' + markup.green('Auth UUID: ' + req.query.auth))
        fs.writeFileSync('./DB/' + req.query.key + '.json', '{}')
        res.sendStatus(200)
      } else {
        res.sendStatus(406)
      }
      break

    default:
      if (!req.query.auth) {
        res.sendStatus(401)
      } else if (keys.includes(req.query.auth)) {
        console.log(markup.green.underline('AUTH') + ' ' + markup.green('Auth UUID: ' + req.query.auth))
        const auth = uuid()
        keys[keys.indexOf(req.query.auth)] = auth
        console.log(markup.magenta.underline('AUTHGEN') + ' ' + markup.magenta('Auth UUID: ' + auth))
        ejs.renderFile('./page/admin_' + req.params.locate + '_' + settings.locale + '.ejs', { auth: auth, dbs: fs.readdirSync('./DB/'), settings: settings, count: count }, (err, str) => {
          if (err) console.error(err)
          res.send(str)
        })
      } else {
        res.redirect('/admin')
      }

      fs.writeFileSync('./auth/keys.json', JSON.stringify(keys))
      break
  }
})

app.get('/admin.css', (req, res) => {
  console.log(markup.cyan.underline('REQUEST') + ' ' + markup.cyan(req.ip + ' ' + req.protocol + ' ' + req.path))
  res.download('./page/css/admin.css')
})

app.get('/favicon.ico', (req, res) => {
  console.log(markup.cyan.underline('REQUEST') + ' ' + markup.cyan(req.ip + ' ' + req.protocol + ' ' + req.path))
  res.download('./page/img/favicon.ico')
})

app.get('/', (req, res) => {
  count.user++
  console.log(markup.cyan.underline('REQUEST') + ' ' + markup.cyan(req.ip + ' ' + req.protocol + ' ' + req.path))
  const temp = {
    databases: []
  }
  fs.readdirSync('./DB').forEach((v) => {
    if (!v.startsWith('_')) {
      temp.databases[temp.databases.length] = v.replace('.json', '')
    }
  })
  res.send(temp)
})

app.get('/:db', (req, res) => {
  count.user++
  count.get++
  console.log(markup.cyan.underline('REQUEST') + ' ' + markup.cyan(req.ip + ' ' + req.protocol + ' ' + req.path))
  if (!fs.existsSync('./DB/' + req.params.db + '.json')) {
    res.sendStatus(404)
  } else if (settings.permission[req.params.db + '.json'].get) {
    const data = JSON.parse(fs.readFileSync('./DB/' + req.params.db + '.json'))
    if (req.query.type === 'xml') {
      res.set('Content-Type', 'text/xml')
      res.send(jsontoxml(data))
    } else if (!req.query.type || req.query.type === 'json') {
      res.set('Content-Type', 'application/json')
      res.send(data)
    }
  } else {
    res.sendStatus(403)
  }
})

app.post('/:db', (req, res) => {
  count.user++
  count.post++
  console.log(markup.cyan.underline('REQUEST') + ' ' + markup.cyan(req.ip + ' ' + req.protocol + ' ' + req.path))
  if (!fs.existsSync('./DB/' + req.params.db + '.json')) {
    res.sendStatus(404)
  } else if (settings.permission[req.params.db + '.json'].post) {
    fs.writeFileSync('./DB/' + req.params.db + '.json', JSON.stringify(req.body))
    res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
})

app.put('/:db', (req, res) => {
  count.user++
  count.put++
  console.log(markup.cyan.underline('REQUEST') + ' ' + markup.cyan(req.ip + ' ' + req.protocol + ' ' + req.path))
  if (!fs.existsSync('./DB/' + req.params.db + '.json')) {
    res.sendStatus(404)
  } else if (settings.permission[req.params.db + '.json'].put) {
    let data = JSON.parse(fs.readFileSync('./DB/' + req.params.db + '.json'))
    data = req.body
    fs.writeFileSync('./DB/' + req.params.db + '.json', JSON.stringify(data))
    res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
})

app.delete('/:db', (req, res) => {
  count.user++
  count.delete++
  console.log(markup.cyan.underline('REQUEST') + ' ' + markup.cyan(req.ip + ' ' + req.protocol + ' ' + req.path))
  if (!fs.existsSync('./DB/' + req.params.db + '.json')) {
    res.sendStatus(404)
  } else if (settings.permission[req.params.db + '.json'].delete) {
    fs.unlinkSync('./DB/' + req.params.db + '.json')
    res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
})

app.listen(settings.PORT)
console.log(markup.hex('#7289DA').bold(settings.locale === 'KR' ? '서버가 실행되었습니다! http://localhost:' + settings.PORT + '/' : 'Server is now Booted! App on at http://localhost:' + settings.PORT + '/'))
