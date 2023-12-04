
// Script for filtering product
const query = window.location.search;
const queryParams = new URLSearchParams(query);
const lowtoHigh = document.getElementById('lowToHigh')
const highToLow = document.getElementById('highToLow')
const pages = queryParams.get('p')
const selectedCategory = queryParams.get('category')
const search = queryParams.get('search')
const baseURL = '/shop';

const queryParameters = [];

if (selectedCategory) {
    queryParameters.push(`category=${selectedCategory}`);
}

lowtoHigh.addEventListener('click', (e) => {
    e.preventDefault()
    queryParameters.push(`sort=lowtoHigh`);

    const finalURL = baseURL + (queryParameters.length > 0 ? `?${queryParameters.join('&')}` : '');
    window.location.href = finalURL
})

highToLow.addEventListener('click', (e) => {
    e.preventDefault()
    queryParameters.push(`sort=highToLow`);
    const finalURL = baseURL + (queryParameters.length > 0 ? `?${queryParameters.join('&')}` : '');
    window.location.href = finalURL

})

// Search input section
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');

searchButton.addEventListener('click', (e) => {
    e.preventDefault()
    const searchTerm = searchInput.value
    queryParameters.push(`search=${searchTerm}`);
    const finalURL = baseURL + (queryParameters.length > 0 ? `?${queryParameters.join('&')}` : '');
    window.location.href = finalURL

})