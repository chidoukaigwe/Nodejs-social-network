//Async Requests
import axios from 'axios'

import Search from './modules/search'

if (document.querySelector('.header-search-icon')) {
    new Search()
}
