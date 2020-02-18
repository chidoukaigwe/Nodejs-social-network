const express = require('express')
//  Express framework will return a mini app/application
const router = express.Router()

router.get('/', function (req, res) {
  res.render('home-guest')  
})

module.exports = router
