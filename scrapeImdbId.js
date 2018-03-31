const scrapeIt = require("scrape-it")

const env = process.env.NODE_ENV || 'development'
const config = require('./config')[env]

const SELECT_ALL_MOVIES_QUERY = `SELECT * FROM ${config.database.table}`
const UPDATE_MOVIE_QUERY = `UPDATE ${config.database.table} SET ? WHERE id = ?`

const updateTableRow = (res, connection, dbId, data, movies, movieIndex) => {
  const params = {
    imdb_id: data.imdb_id
  }
  connection.query(UPDATE_MOVIE_QUERY, [params, dbId], (err, results) => {
    if (err) {
      if (err) throw err
    } else {
      if (movieIndex < movies.length - 1) {
        return scrapeLetterboxdMovie(res, connection, movies, movieIndex + 1)
      } else {
        return res.json({
          success: true,
          moviesLength: movies.length
        })
      }
    }
  })
}

const scrapeLetterboxdMovie = (res, connection, movies, movieIndex = 0) => {
  scrapeIt(`https://letterboxd.com${movies[movieIndex].letterboxd_url}`, {
    imdb_id: {
      selector: ".micro-button[data-track-action=IMDb]",
      attr: "href",
      convert: url => url.split('/').find(item => /\d/.test(item))
    }
  }).then(({ data }) => {
    updateTableRow(res, connection, movies[movieIndex].id, data, movies, movieIndex)
  }).catch(error => res.send(error))
}

const scrapeImdbId = (res, connection) => {
  connection.query(SELECT_ALL_MOVIES_QUERY, (err, results) => {
    if (err) {
      return res.send(err)
    } else {
      scrapeLetterboxdMovie(res, connection, results)
    }
  })
}

module.exports = scrapeImdbId
