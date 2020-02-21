//  Require in DOTENV
const dotenv = require('dotenv')
dotenv.config()
const mongodb = require('mongodb')
//  This is how you access env variables
mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, client) {

  // Return Mongo DB Object - With the module.exports any file that requires this file - will have the db connection return to the file for usage
  module.exports = client

  //  We want to connect to a DB before we load/connect to our express app
  const app = require('./app')

  app.listen(process.env.PORT)

})