const scrapeIt = require("scrape-it")

const { scrapeImdbIdFromPage } = require('./scrapeImdbId')
const { getInfoFromTMDB } = require('./tmdb')
const { getMovieFromDBByOriginalTitle, insertTableRow, updateTableRow } = require('./db')

const scrapeMoviePage = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject('Need url')
    }
    if (!url.includes('https://letterboxd.com/mansurov/film/')) {
      reject('Wrong url')
    }
    const movieSelectors = {
      original_title: {
        selector: ".film-poster",
        attr: "data-film-name"
      },
      year: {
        selector: ".film-poster",
        attr: "data-film-release-year"
      },
      rating: {
        selector: "meta[itemprop=ratingValue]",
        attr: "content",
        convert: x => Number(x)
      },
      watched_date: {
        selector: "meta[itemprop=datePublished]",
        attr: "content",
        convert: (url) => {
          const date = url.split('-')
          return new Date(date[0], date[1] - 1, date[2])
        }
      },
      letterboxd_url: {
        selector: ".film-poster",
        attr: "data-film-link"
      }
    }
    scrapeIt(url, movieSelectors)
      .then(({ data }) => {
        resolve(data)
      })
      .catch(error => reject(error))
  })
}

const getMovieInfo = async (url) => {
  const movie = await scrapeMoviePage(url)
  if (!movie.letterboxd_url) {
    return {
      movie,
      movie_info: 'NO_LETTERBOXD_URL'
    }
  }
  const { imdb_id } = await scrapeImdbIdFromPage(movie.letterboxd_url)
  if (!imdb_id) {
    return {
      movie,
      movie_info: 'NO_IMDB_ID'
    }
  }
  const dataFromTMDB = await getInfoFromTMDB(imdb_id)
  const releaseDateArray = dataFromTMDB.release_date.split('-')
  return {
    movie: {
      ...movie,
      imdb_id,
      title: dataFromTMDB.title,
      release_date: new Date(releaseDateArray[0], releaseDateArray[1] - 1, releaseDateArray[2]),
      poster: dataFromTMDB.poster_path
    },
    movie_info: 'OK'
  }
}

const addOneMovie = async (url) => {
  const { movie, movie_info } = await getMovieInfo(url)
  const movieFromDB = await getMovieFromDBByOriginalTitle(movie.original_title)
  if (movieFromDB) {
    await updateTableRow(movie, movieFromDB.id)
    return {
      success: true,
      status: 'UPDATED',
      movie_info
    }
  } else {
    await insertTableRow(movie)
    return {
      success: true,
      status: 'INSERTED',
      movie_info
    }
  }
}

module.exports = addOneMovie
