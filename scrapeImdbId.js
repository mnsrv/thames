const scrapeIt = require("scrape-it")

const { getMoviesFromDB, updateTableRow } = require('./db')

const scrapeImdbIdFromPage = (letterboxd_url) => {
  return new Promise((resolve, reject) => {
    const imdbSelector = {
      imdb_id: {
        selector: ".micro-button[data-track-action=IMDb]",
        attr: "href",
        convert: url => url.split('/').find(item => /\d/.test(item))
      }
    }
    scrapeIt(`https://letterboxd.com${letterboxd_url}`, imdbSelector)
      .then(({ data }) => resolve(data))
      .catch(error => reject(error))
  })
}

const scrapeImdbId = async () => {
  let countInserted = 0
  const movies = await getMoviesFromDB()
  for (let movie of movies) {
    if (movie.letterboxd_url && !movie.imdb_id) {
      const { imdb_id } = await scrapeImdbIdFromPage(movie.letterboxd_url)
      if (imdb_id) {
        countInserted++
        await updateTableRow({ imdb_id }, movie.id)
      }
    }
  }
  return {
    success: true,
    countInserted,
    moviesLength: movies.length
  }
}

module.exports = {
  scrapeImdbId,
  scrapeImdbIdFromPage
}
