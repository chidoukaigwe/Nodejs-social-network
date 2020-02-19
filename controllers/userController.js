//  Bring in User Model
const User = require('../models/User')

//  req & res come from the callback function made within router.js and therefore router.js can pass the two args (req & res)
exports.login = function () {

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
  res.render('home-guest')
}