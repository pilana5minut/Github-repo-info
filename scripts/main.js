const BASE_URL = 'https://api.github.com'
const searchField = document.getElementById('search-field')
const autocompleteList = document.getElementById('autocomplete-list')
const reposList = document.getElementById('repos-list')
const requestLimitMessage = document.getElementById('request-limit-message')
const repositoriesListIndex = new Map()

///////////////////////////////////////////////////////////////////////////////

searchField.addEventListener('input', (evt) => {
  debouncedQuery(evt.currentTarget.value)
})

searchField.addEventListener('focus', (evt) => {
  debouncedQuery(evt.currentTarget.value)
})

const debouncedQuery = debounce(333, repositoryQuery)

///////////////////////////////////////////////////////////////////////////////

async function repositoryQuery(repoName) {
  if (repoName.trim() === '') {
    autocompleteList.innerHTML = ''
    return
  }

  const response = await fetch(`${BASE_URL}/search/repositories?q=${repoName}&per_page=10&sort=stars`, {
    headers: { accept: "application/vnd.github+json", }
  })
  const data = await response.json()

  autocompleteList.innerHTML = ''
  showAutocompleteList(data.items)
  queryStatistics(response.headers)
}

function debounce(delay, decorFn) {
  let timer
  return function wrapper(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => { decorFn(...args) }, delay)
  }
}

///////////////////////////////////////////////////////////////////////////////

function showAutocompleteList(repositoryList) {
  repositoryList.forEach(repo => {
    const listItem = document.createElement('li')
    listItem.classList.add('autocomplete-list__item')
    listItem.innerHTML = `
      <span class="autocomplete-list__repo-name">${repo.name}</span>
      <span class="autocomplete-list__repo-owner">-> ${repo.owner.login} -></span>
      <span class="autocomplete-list__repo-stars">${repo.stargazers_count}</span>
    `
    listItem.addEventListener('click', () => { addToRepositoriesList(repo) })
    autocompleteList.append(listItem)

  })

  autocompleteList.style.cssText = `
    width: ${searchField.offsetWidth}px;
  `
}

function addToRepositoriesList(repo) {
  if (repositoriesListIndex.has(repo.id)) {
    autocompleteList.innerHTML = ''
    return
  }

  const listItem = document.createElement('li')
  listItem.classList.add('repos-list__item')
  listItem.innerHTML = `
        <ul class="repos-list__info block-info-list">
      <li class="block-info-list__item block-info-list__item--name" title="Repository name.">
        <a class="block-info-list__link" href="${repo.html_url}" target="_blank"
          rel="noopener noreferrer">${repo.name}</a>
      </li>
      <li class="block-info-list__item block-info-list__item--owner"
        title="Repository owner.">
        <a class="block-info-list__link" href="${repo.owner.html_url}" target="_blank"
          rel="noopener noreferrer">${repo.owner.login}</a>
      </li>
      <li class="block-info-list__item block-info-list__item--stars"
        title="Number of repository stars.">
        <span class="block-info-list__score">${repo.stargazers_count}</span>
      </li>
    </ul>
    <button class="repos-list__button" id="card-close-button" type="button" title="Remove from the list"></button>
  `

  listItem.querySelector('#card-close-button').addEventListener('click', () => {
    listItem.remove()
    repositoriesListIndex.delete(repo.id)
  })

  reposList.append(listItem)
  autocompleteList.innerHTML = ''
  repositoriesListIndex.set(repo.id, repo.name)
}

///////////////////////////////////////////////////////////////////////////////

function queryStatistics(headersList) {
  const limit = headersList.get('x-ratelimit-limit')
  const remaining = headersList.get('x-ratelimit-remaining')

  console.log(`Осталось запросов в минуту: ${remaining} из ${limit}`)

  if (remaining <= 1) {
    console.warn(`Был достигнут лимит запросов. Таймаут 1 минута.`)
    autocompleteList.innerHTML = ''
    disableSearchForm(60000)
  }
}

function disableSearchForm(timeout) {
  const currentValueInField = searchField.value
  let count = timeout / 1000

  searchField.value = 'Таймаут: 60 сек.'
  searchField.disabled = true
  requestLimitMessage.style.display = 'block'

  const intervalId = setInterval(() => {
    count--
    searchField.value = `Таймаут: ${count} сек.`
  }, 1000)

  setTimeout(() => {
    clearInterval(intervalId)

    searchField.value = currentValueInField
    searchField.disabled = false
    requestLimitMessage.style.display = 'none'
    debouncedQuery(currentValueInField)
  }, timeout)
}
