const express = require('express')
//  Express framework will return a mini app/application
const router = express.Router()
//  Import User Controller
const userController = require('./controllers/userController')
// Import Post Controller 
const postController = require('./controllers/postController')

//  User Related Routes
//=====================

//  Get Homepage
router.get('/', userController.home)

//  Post Route For User Registering On App
router.post('/register', userController.register)

//  Post route for User Login Form
router.post('/login', userController.login)

// Post route for User Logout Form 
router.post('/logout', userController.logout)

//  Post Related Routes 
//=====================

router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen)

//Send Post
router.post('/create-post', userController.mustBeLoggedIn, postController.create)

//Get Single Post 
router.get('/post/:id', postController.viewSingle)

//  Profile Related Posts 
//=======================
router.get('/profile/:username', userController.ifUserExists, userController.profilePostsScreen)

//Get edited post
router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.viewEditScreen)

//Save Updates To A Post 
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.edit)

//
router.post('/search', postController.search)

module.exports = router
