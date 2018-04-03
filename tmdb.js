const axios = require('axios')

const { getMoviesFromDB, updateTableRow } = require('./db')

const env = process.env.NODE_ENV || 'development'
const config = require('./config')[env]

const API_KEY = config.secret.TMDB_API_KEY

const serialize = (obj) => {
  let str = []
  for (let p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]))
    }
  return str.join("&")
}

const getInfoFromTMDB = (imdb_id) => {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      reject('No tmdb api key')
    }
    const params = {
      api_key: API_KEY,
      language: 'ru',
      region: 'RU',
      external_source: 'imdb_id'
    }
    const url = `https://api.themoviedb.org/3/find/${imdb_id}?${serialize(params)}`
    axios.get(url)
      .then(response => resolve(response.data.movie_results[0]))
      .catch(error => reject(error))
  })
}

const tmdb = async () => {
  let countInserted = 0
  const movies = await getMoviesFromDB()
  for (let movie of movies) {
    if (movie.imdb_id) {
      const dataFromTMDB = await getInfoFromTMDB(movie.imdb_id)
      const releaseDateArray = dataFromTMDB.release_date.split('-')
      const data = {
        title: dataFromTMDB.title,
        release_date: new Date(releaseDateArray[0], releaseDateArray[1] - 1, releaseDateArray[2]),
        poster: dataFromTMDB.poster_path
      }
      countInserted++
      await updateTableRow(data, movie.id)
    }
  }
  return {
    success: true,
    countInserted,
    moviesLength: movies.length
  }
}

module.exports = {
  getInfoFromTMDB,
  tmdb
}
