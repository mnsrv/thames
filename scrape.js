const scrapeIt = require("scrape-it")

const env = process.env.NODE_ENV || 'development'
const config = require('./config')[env]

const TRUNCATE_LETTERBOXD_QUERY = `TRUNCATE TABLE ${config.database.table}`
const INSERT_MOVIES_QUERY = `INSERT INTO ${config.database.table} (title, year, rating, watched_date) VALUES ?`

const scrapeLetterboxd = (res, connection, page = 1, movies = []) => {
  scrapeIt(`https://letterboxd.com/mansurov/films/diary/page/${page}/`, {
    movies: {
      listItem: ".diary-entry-row",
      data: {
        title: ".headline-3 a",
        year: ".td-released span",
        rating: {
          selector: ".td-rating .rateit-field",
          attr: "value",
          convert: x => Number(x) / 2
        },
        watched_date: {
          selector: ".td-day a",
          attr: "href",
          convert: (url) => {
            const strArray = url.slice(url.indexOf('/for/') + 5).split('/')
            return new Date(strArray[0], strArray[1] - 1, strArray[2])
          }
        }
      }
    }
  }).then(({ data }) => {
    if (data.movies.length) {
      scrapeLetterboxd(res, connection, page + 1, [...movies, ...data.movies])
    } else {
      clearTable(res, connection, () => {
        insertIntoTable(res, connection, movies.reverse())
      })
      // return res.json({ movies })
    }
  }).catch(error => res.send(error))
}
const insertIntoTable  = (res, connection, data) => {
  const values = data.map(item => Object.keys(item).map(key => item[key]))
  connection.query(INSERT_MOVIES_QUERY, [values], (err, results) => {
    if (err) {
      if (err) throw err
    } else {
      return res.json({ data })
    }
  })
}
const clearTable = (res, connection, callback) => {
  connection.query(TRUNCATE_LETTERBOXD_QUERY, (err, results) => {
    if (err) {
      return res.send(err)
    } else {
      callback()
    }
  })
}

module.exports = scrapeLetterboxd
