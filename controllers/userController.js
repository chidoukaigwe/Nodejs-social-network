//  Bring in User Model
const User = require('../models/User')

//  req & res come from the callback function made within router.js and therefore router.js can pass the two args (req & res)
exports.login = function (req, res) {
  let user = new User(req.body)
  //  Passing this function as an argument into the login function
  user.login().then(function (result) {
    //  Add new properties onto the session object  - our REQ object has this NEW SESSION OBJ that has this user property PER browser request
    req.session.user = {username : user.data.username}
    res.send(result)
  }).catch(function (err) {
    res.send(err)
  })
}

exports.logout = function () {
    
}

exports.register = function (req, res) {
  let user = new User(req.body)
  user.register()
  if (user.errors.length) {
    res.send(user.errors)
  } else {
    res.send('Congrats there are no errors.')
  }
}

exports.home = function (req, res) {
  if (req.session.user) {
    res.send('Welcome to the actual application')
  } else {
    res.render('home-guest')
  }
}