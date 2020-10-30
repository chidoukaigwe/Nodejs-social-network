//  File we add new request features

const express = require('express')
// Dealing with cross site scripting
const csrf = require('csurf')
//  Cache User Sessions
const session = require('express-session')
//  Cache user Sessions on the DB - capitalised to indicate we will be creating objects from this.
const MongoStore = require('connect-mongo')(session)
//  Enabled Flash Messages 
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')

const app = express()

//  [ two most common ways of accepting data across the web ]
//  Boilerplate Code add user submitted data onto our request object so we can access it via req.body
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// API Router  - As this line of code is above the app.use() function that will bring in a bunch of code - this API router does not have to apply those functions calls within the app.use main function, therefore making the route lighter
app.use('/api', require('./router-api'))

//

//  Boilerplate Config Code
let sessionOptions = session({
    secret: 'Javascript is so cool',
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    // Max 1 day before cookie expires
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

//  Invoking Sessions
app.use(sessionOptions)
//  Invoking Flash Messages Into APP
app.use(flash())

//  app.use() is telling express run this function for every request
//  All app.use before the router function kicks in is invoked before page load
//  res.locals allows the EJS Templates to use all variables
app.use(function (req, res, next) {

    // makr our markdown function available from within ejs templates
    res.locals.filterUserHTML = function (content) {
        return sanitizeHTML(markdown(content), {allowedTags:['p', 'br', 'ol', 'li', 'ul', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes:{}})
    }

    // make all error and sucess flash messages available from all templates
    res.locals.errors = req.flash('errors')
    res.locals.success = req.flash('success')

    //  make current user id available on the req object 
    if (req.session.user) {
        req.visitorId = req.session.user._id
    }else{
        req.visitorId = 0
    }
    //  make user session data available from within view templates
    //  add any objects or properties onto this locals obj
    res.locals.user = req.session.user
    next()
})

const router = require('./router')

//  Make public files accessible (css/browserJS)
app.use(express.static('public'))
//  Render template file 1st Argument Express option called views [ 2nd Argument is the folder to look in ]
app.set('views', 'views')
//  Which templating engine we are using - 2nd Arg which template engine we are using
//  We tell express to use the EJS template engine - install via NPM
app.set('view engine', 'ejs')

// Any of the HTTP Methods POST CREATE DELETE PUT - will have to have a matching CSRF Token
app.use(csrf())

// Make Token Availabe To Use In Templates
app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken()
  next()
})

app.use('/', router)

app.use(function (err, req, res, next) {

  if (err) {

    if(err.code == 'EBADCSRFTOKEN') {
      req.flash('errors', 'Cross site request forgery detected')
      req.session.save(() => res.redirect('/'))
    }else{
      res.render('404')
    }

  }

})

const server = require('http').createServer(app)
const io = require('socket.io')(server)

io.use(function(socket, next) {
  sessionOptions(socket.request, socket.request.res, next)
})

io.on('connection', function(socket) {
  if (socket.request.session.user) {
    let user = socket.request.session.user

    socket.emit('welcome', {username: user.username, avatar: user.avatar})

    socket.on('chatMessageFromBrowser', function(data) {
      socket.broadcast.emit('chatMessageFromServer', {message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: {}}), username: user.username, avatar: user.avatar})
    })
  }
})

//  Still creating a Node Express App - we removed the app.listen() as this file is the bootstrap - refer to db.js
module.exports = server
