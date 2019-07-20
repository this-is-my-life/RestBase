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

if (settings.useCors) {
  app.use(cors())
}

if (!settings.permission) {
  settings.permission = {}
}

if (!fs.existsSync('./DB/')) {
  fs.mkdirSync('./DB/')
}

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

fs.writeFileSync('./settings.js', 'module.exports = ' + JSON.stringify(settings))

fs.writeFileSync('./auth/keys.json', '[]')
const keys = require('./auth/keys.json')

app.get('/admin', (req, res) => {
  console.log(markup.cyan.underline('REQUEST') + ' ' + markup.cyan(req.ip + ' ' + req.protocol + ' ' + req.path))
  const temp = fs.readFileSync('./page/admin_' + settings.locale + '.html')
  res.send(temp.toString('utf-8'))
})

app.get('/admin/:locate', (req, res) => {
  switch (req.params.locate) {
    case 'verity':
      if (!req.query.id || !req.query.pw) {
        res.redirect('/admin')
      } else if (settings.adminSettings.adminID === req.query.id && settings.adminSettings.adminPW === req.query.pw) {
        const authToken = uuid()
        keys[keys.length] = authToken
        res.redirect('/admin/dashboard?auth=' + authToken)
      } else {
        res.redirect('/admin')
      }
      break

    default:
      if (!req.query.auth) {
        res.sendStatus(401)
      } else if (keys.includes(req.query.auth)) {
        const auth = uuid()
        keys[keys.indexOf(req.query.auth)] = auth
        ejs.renderFile('./page/admin_' + req.params.locate + '_' + settings.locale + '.ejs', { auth: auth, dbs: fs.readdirSync('./DB/') }, (err, str) => {
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
  console.log(markup.cyan.underline('REQUEST') + ' ' + markup.cyan(req.ip + ' ' + req.protocol + ' ' + req.path))
  if (!fs.existsSync('./db/' + req.params.db + '.json')) {
    res.sendStatus(404)
  } else {
    const data = require('./db/' + req.params.db + '.json')
    if (req.query.type === 'xml') {
      res.set('Content-Type', 'text/xml')
      res.send(jsontoxml(data))
    } else if (!req.query.type || req.query.type === 'json') {
      res.set('Content-Type', 'application/json')
      res.send(data)
    }
  }
})

app.listen(settings.PORT)
console.log(markup.hex('#7289DA').bold(settings.locale === 'KR' ? '서버가 실행되었습니다! http://localhost:' + settings.PORT + '/' : 'Server is now Booted! App on at http://localhost:' + settings.PORT + '/'))
