//Async Requests
import axios from 'axios'

//Import Search File
import Search from './modules/search'

//Import Registration Form 
import RegistrationForm from './modules/registrationForm'

// Import Chat File 
import Chat from './modules/chat'

if (document.querySelector('.header-search-icon')) {
    new Search()
}

if (document.querySelector('#chat-wrapper')) {
    new Chat()
}

if (document.querySelector('#registration-form')) {

    new RegistrationForm()

}
