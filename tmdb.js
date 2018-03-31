const axios = require('axios')

const env = process.env.NODE_ENV || 'development'
const config = require('./config')[env]

const API_KEY = config.secret.TMDB_API_KEY

const SELECT_ALL_MOVIES_QUERY = `SELECT * FROM ${config.database.table}`
const UPDATE_MOVIE_QUERY = `UPDATE ${config.database.table} SET ? WHERE id = ?`

const serialize = (obj) => {
  let str = []
  for (let p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]))
    }
  return str.join("&")
}

const updateTableRow = (res, connection, dbId, data, movies, movieIndex) => {
  const releaseDateArray = data.release_date.split('-')
  const params = {
    title: data.title,
    release_date: new Date(releaseDateArray[0], releaseDateArray[1] - 1, releaseDateArray[2]),
    poster: data.poster_path
  }
  connection.query(UPDATE_MOVIE_QUERY, [params, dbId], (err, results) => {
    if (err) {
      if (err) throw err
    } else {
      return getInfoFromTMDB(res, connection, movies, movieIndex + 1)
    }
  })
}

const getInfoFromTMDB = (res, connection, movies, index = 0) => {
  if (!API_KEY) {
    return res.status(500).send({ error: 'No tmdb api key' })
  }
  if (index >= movies.length) {
    return res.json({
      success: true,
      moviesLength: movies.length
    })
  }
  const query = movies[index].original_title
  const year = movies[index].year
  const dbId = movies[index].id
  const params = {
    api_key: API_KEY,
    language: 'ru',
    region: 'RU',
    external_source: 'imdb_id'
  }
  const url = `https://api.themoviedb.org/3/find/${movies[index].imdb_id}?${serialize(params)}`
  axios.get(url)
    .then(response => {
      updateTableRow(res, connection, dbId, response.data.movie_results[0], movies, index)
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
      console.log(error.config);
    })
}

const tmdb = (res, connection) => {
  connection.query(SELECT_ALL_MOVIES_QUERY, (err, results) => {
    if (err) {
      return res.send(err)
    } else {
      getInfoFromTMDB(res, connection, results)
      // return res.json({
      //   data: results
      // })
    }
  })
}

module.exports = tmdb
