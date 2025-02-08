const BASE_URL = 'https://api.github.com'
const searchField = document.getElementById('search-field')
const autocompleteList = document.getElementById('autocomplete-list')
const reposList = document.getElementById('repos-list')

///////////////////////////////////////////////////////////////////////////////

async function repositoryQuery(repoName) {
  if (repoName.trim() === '') {
    autocompleteList.innerHTML = ''
    return
  }
  const response = await fetch(`${BASE_URL}/search/repositories?q=${repoName}&per_page=9&sort=stars`, {
    headers: { accept: "application/vnd.github+json", }
  })
  console.warn("Доступно запросов: ", response.headers.get('x-ratelimit-limit'))
  console.warn("Осталось запросов: ", response.headers.get('x-ratelimit-remaining'))

  const data = await response.json()
  console.log(data.items)
  autocompleteList.innerHTML = ''
  showAutocompleteList(data.items)
}

function debounce(delay, decorFn) {
  let timer
  return function wrapper(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => { decorFn(...args) }, delay)
  }
}

const debouncedQuery = debounce(333, repositoryQuery)

searchField.addEventListener('input', (evt) => {
  debouncedQuery(evt.currentTarget.value)
})

async function repositoryQuery(repoName) {
  const response = await fetch(`${BASE_URL}/search/repositories?q=${repoName}`)
  const data = await response.json()
  console.log(data.items)
  showAutocompleteList(data.items)
}

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

  listItem.querySelector('#card-close-button').addEventListener('click', () => { listItem.remove() })
  reposList.append(listItem)
}
