const express = require('express')
const cors = require('cors')
const mysql = require('mysql')

const env = process.env.NODE_ENV || 'development';
const config = require('./config')[env];

const app = express()

const SELECT_ALL_MOVIES_QUERY = 'SELECT * FROM letterboxd_diary'

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

app.listen(config.server.port, () => {
  console.log(`Thames server listening on port ${config.server.port}`)
})