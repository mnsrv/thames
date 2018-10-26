const mysql = require('mysql')

const env = process.env.NODE_ENV || 'development'
const config = require('./config')[env]

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

const SELECT_ALL_MOVIES_QUERY = `SELECT * FROM ${config.database.table}`
const SELECT_LAST_TWO_MONTHS_MOVIES_QUERY = `SELECT * FROM ${config.database.table} WHERE watched_date BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW()`
const SELECT_MOVIE = `SELECT * FROM ${config.database.table} WHERE original_title = ?`
const UPDATE_MOVIE_QUERY = `UPDATE ${config.database.table} SET ? WHERE id = ?`
const INSERT_MOVIES_QUERY = `INSERT INTO ${config.database.table} (original_title, year, rating, watched_date, letterboxd_url) VALUES ?`
const INSERT_FULL_MOVIE_QUERY = `INSERT INTO ${config.database.table} SET ?`
const TRUNCATE_LETTERBOXD_QUERY = `TRUNCATE TABLE ${config.database.table}`

const getMoviesFromDB = () => {
  return new Promise((resolve, reject) => {
    connection.query(SELECT_LAST_TWO_MONTHS_MOVIES_QUERY, (err, results) => {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}
const getMovieFromDBByOriginalTitle = (original_title) => {
  return new Promise((resolve, reject) => {
    connection.query(SELECT_MOVIE, [original_title], (err, results) => {
      if (err) {
        reject(err)
      } else {
        if (results.length > 1) {
          reject('More than one element found')
        }
        resolve(results[0])
      }
    })
  })
}
const updateTableRow = (data, id) => {
  return new Promise((resolve, reject) => {
    connection.query(UPDATE_MOVIE_QUERY, [data, id], (err, results) => {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}
const insertTableRow = (data) => {
  return new Promise((resolve, reject) => {
    connection.query(INSERT_FULL_MOVIE_QUERY, data, (err, results) => {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}
const insertMoviesToDB = (data) => {
  return new Promise((resolve, reject) => {
    const values = data.map(item => Object.keys(item).map(key => item[key]))
    connection.query(INSERT_MOVIES_QUERY, [values], (err, results) => {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}
const clearTable = () => {
  return new Promise((resolve, reject) => {
    connection.query(TRUNCATE_LETTERBOXD_QUERY, (err, results) => {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}

module.exports = {
  getMoviesFromDB,
  getMovieFromDBByOriginalTitle,
  updateTableRow,
  insertTableRow,
  insertMoviesToDB,
  clearTable
}
