const express = require('express')
//  Express framework will return a mini app/application
const router = express.Router()
//  Import User Controller
const userController = require('./controllers/userController')

//  Get Homepage
router.get('/', userController.home)

//  Post Route For User Registering On App
router.post('/register', userController.register)

module.exports = router
