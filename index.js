const express = require('express')
const cors = require('cors')
const axios = require('axios')
const bodyParser = require('body-parser')
const asyncHandler = require('express-async-handler')

const env = process.env.NODE_ENV || 'development'
const config = require('./config')[env]

const scrapeLetterboxd = require('./scrape')
const { scrapeImdbId } = require('./scrapeImdbId')
const { tmdb } = require('./tmdb')
const addOneMovie = require('./addOneMovie')
const { getMoviesFromDB } = require('./db')

const logErrors = (err, req, res, next) => {
  console.error(err.stack)
  next(err)
}
const clientErrorHandler = (err, req, res, next) => {
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' })
  } else {
    next(err)
  }
}
const errorHandler = (err, req, res, next) => {
  res.status(500)
  res.render('error', { error: err })
}

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(logErrors)
app.use(clientErrorHandler)
app.use(errorHandler)

app.get('/movies', asyncHandler(async (req, res, next) => {
  const movies = await getMoviesFromDB()
  return res.json(movies)
}))

app.get('/weather', asyncHandler(async (req, res, next) => {
  const city = '524901'
  const appid = config.secret.WEATHER_API_KEY
  if (!appid) {
    throw new Error('No weather api key')
  }
  const url = `http://api.openweathermap.org/data/2.5/weather?id=${city}&units=metric&APPID=${appid}`
  const response = await axios.get(url)
  return res.json({
    temperature: response.data.main.temp
  })
}))

app.get('/letterboxd', asyncHandler(async (req, res, next) => {
  const appid = config.secret.ALFRED_API_SECRET
  if (!appid) {
    throw new Error('No secret')
  }
  if (!req.query.password) {
    throw new Error('Need password')
  }
  if (req.query.password !== config.secret.ALFRED_API_SECRET) {
    throw new Error('Wrong password')
  }
  const status = await scrapeLetterboxd()
  return res.json(status)
}))

app.get('/imdb_id', asyncHandler(async (req, res, next) => {
  const appid = config.secret.ALFRED_API_SECRET
  if (!appid) {
    throw new Error('No secret')
  }
  if (!req.query.password) {
    throw new Error('Need password')
  }
  if (req.query.password !== config.secret.ALFRED_API_SECRET) {
    throw new Error('Wrong password')
  }
  const status = await scrapeImdbId()
  return res.json(status)
}))

app.get('/tmdb', asyncHandler(async (req, res, next) => {
  const appid = config.secret.ALFRED_API_SECRET
  if (!appid) {
    throw new Error('No secret')
  }
  if (!req.query.password) {
    throw new Error('Need password')
  }
  if (req.query.password !== config.secret.ALFRED_API_SECRET) {
    throw new Error('Wrong password')
  }
  const status = await tmdb()
  return res.json(status)
}))

app.post('/letterboxd', asyncHandler(async (req, res, next) => {
  const appid = config.secret.ALFRED_API_SECRET
  if (!appid) {
    throw new Error('No secret')
  }
  if (!req.body.password) {
    throw new Error('Need password')
  }
  if (req.body.password !== config.secret.ALFRED_API_SECRET) {
    throw new Error('Wrong password')
  }
  const status = await addOneMovie(req.body.url)
  return res.json(status)
}))

app.listen(config.server.port, () => {
  console.log(`Thames server listening on port ${config.server.port}`)
})
