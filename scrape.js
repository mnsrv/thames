const scrapeIt = require("scrape-it")

const {clearTable, insertMoviesToDB} = require('./db')

const scrapeDataFromPage = (page = 1) => {
  return new Promise((resolve, reject) => {
    const selectors = {
      movies: {
        listItem: ".diary-entry-row",
        data: {
          original_title: ".headline-3 a",
          year: ".td-released span",
          rating: {
            selector: ".td-rating .rateit-field",
            attr: "value",
            convert: x => Number(x)
          },
          watched_date: {
            selector: ".td-day a",
            attr: "href",
            convert: (url) => {
              const strArray = url.slice(url.indexOf('/for/') + 5).split('/')
              return new Date(strArray[0], strArray[1] - 1, strArray[2])
            }
          },
          letterboxd_url: {
            selector: ".td-film-details .film-poster",
            attr: "data-film-slug"
          }
        }
      }
    }
    scrapeIt(`https://letterboxd.com/mansurov/films/diary/page/${page}/`, selectors)
      .then(({data}) => {
        resolve(data.movies)
      })
      .catch(error => reject(error))
  })
}

const removeDuplicates = (movies) => movies.filter((movie, index, array) => array.findIndex(m => m.original_title === movie.original_title && m.year === movie.year && m.letterboxd_url === movie.letterboxd_url) === index)

const scrapeLetterboxd = async () => {
  const movies = []
  let page = 1
  while (page > 0) {
    const moviesFromPage = await scrapeDataFromPage(page)
    if (moviesFromPage.length > 0) {
      movies.push(...moviesFromPage)
      page++
    } else {
      page = 0
    }
  }
  const newMovies = removeDuplicates(movies).reverse()
  await clearTable()
  await insertMoviesToDB(newMovies)
  return {
    success: true,
    moviesLength: movies.length,
    newMoviesLength: newMovies.length
  }
}

module.exports = scrapeLetterboxd
