const express = require('express')
const cors = require('cors')
const mysql = require('mysql')
const axios = require('axios')

const env = process.env.NODE_ENV || 'development'
const config = require('./config')[env]

const scrapeLetterboxd = require('./scrape')
const scrapeImdbId = require('./scrapeImdbId')
const tmdb = require('./tmdb')

const app = express()

const SELECT_ALL_MOVIES_QUERY = `SELECT * FROM ${config.database.table}`

const connection = mysql.createConnection({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database
})

connection.connect(err => {
  if (err) {
    return err
  }
})

app.use(cors())

app.get('/movies', (req, res) => {
  connection.query(SELECT_ALL_MOVIES_QUERY, (err, results) => {
    if (err) {
      return res.send(err)
    } else {
      return res.json({
        data: results
      })
    }
  })
})

app.get('/weather', (req, res) => {
  const city = '524901'
  const appid = config.secret && config.secret.WEATHER_API_KEY || ''
  if (!appid) {
    return res.status(500).send({ error: 'No weather api key' })
  }
  const url = `http://api.openweathermap.org/data/2.5/weather?id=${city}&units=metric&APPID=${appid}`

  axios.get(url)
    .then(response => {
      return res.json({
        temperature: response.data.main.temp
      })
    })
    .catch(error => res.send(error))
})

app.get('/letterboxd', (req, res) => {
  const appid = config.secret && config.secret.ALFRED_API_SECRET || ''
  if (!appid) {
    return res.status(500).send({ error: 'no secret' })
  }
  if (req.query.password === config.secret.ALFRED_API_SECRET) {
    scrapeLetterboxd(res, connection)
  } else {
    return res.status(500).send({ error: 'wrong secret' })
  }
})

app.get('/imdb_id', (req, res) => {
  const appid = config.secret && config.secret.ALFRED_API_SECRET || ''
  if (!appid) {
    return res.status(500).send({ error: 'no secret' })
  }
  if (req.query.password === config.secret.ALFRED_API_SECRET) {
    scrapeImdbId(res, connection)
  } else {
    return res.status(500).send({ error: 'wrong secret' })
  }
})

app.get('/tmdb', (req, res) => {
  const appid = config.secret && config.secret.ALFRED_API_SECRET || ''
  if (!appid) {
    return res.status(500).send({ error: 'no tg secret' })
  }
  if (req.query.password === config.secret.ALFRED_API_SECRET) {
    tmdb(res, connection)
  } else {
    return res.status(500).send({ error: 'wrong tg secret' })
  }
})

app.listen(config.server.port, () => {
  console.log(`Thames server listening on port ${config.server.port}`)
})
