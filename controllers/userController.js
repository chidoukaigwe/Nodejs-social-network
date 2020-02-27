//  Bring in User Model
const User = require('../models/User')

exports.mustBeLoggedIn = function(req, res, next) {
  if (req.session.user) {
    next()
  } else {
    req.flash("errors", "You must be logged in to perform that action")
    req.session.save(function () {
      res.redirect('/')
    })
  }
}

//  req & res come from the callback function made within router.js and therefore router.js can pass the two args (req & res)
exports.login = function (req, res) {
  let user = new User(req.body)
  //  Passing this function as an argument into the login function
  user.login().then(function (result) {
    //  Add new properties onto the session object  - our REQ object has this NEW SESSION OBJ that has this user property PER browser request
    req.session.user = {
      avatar: user.avatar, 
      username : user.data.username,
      _id: user.data._id
    }
    //  Manually telling session package to SAVE SESSION TO DB - once done invoke callback function and redirect user to homepage.
    req.session.save(function () {
      res.redirect('/')
    })
  }).catch(function (err) {
    // Persistent memory of a specific request - Storing failed login attempt in the database (leverage sessions) 
    // Flash package - adds a flash object - onto the REQUEST obj
    req.flash('errors', err)  
    req.session.save(function() {
      res.redirect('/')
    })
  })
}

exports.logout = function (req, res) {
    req.session.destroy(function () {
      res.redirect('/')
    })
}

exports.register = function (req, res) {
  let user = new User(req.body)
  user.register().then(() => {
    req.session.user = {
      username:user.data.username, 
      avatar: user.avatar,
      _id: user.data
    }
    req.session.save(function () {
      res.redirect('/')
    })
  }).catch((regErrors) => {
    regErrors.forEach(function(error) {
      req.flash('regErrors', error)
    })
    req.session.save(function () {
      res.redirect('/')
    })
  })

}

exports.home = function (req, res) {
  if (req.session.user) {
    res.render('home-dashboard')
  } else {
    res.render('home-guest', {errors: req.flash('errors'), regErrors: req.flash('regErrors')})
  }
}