const bcrypt = require('bcryptjs')
//  usersColletion variable we are able to perform CRUD on
const usersCollection = require('../db').db().collection('users')
const validator = require('validator')

//  Constructor Function - For User Object
let User = function (data) {
//  User Object Properties
  this.data = data
  this.errors = []
}

User.prototype.cleanUp = function () {
  //  Remove any non-string value
  if ( typeof(this.data.username) != 'string') {this.data.username = ''}
  if ( typeof(this.data.email) != 'string') {this.data.email = ''}
  if ( typeof(this.data.password) != 'string') {this.data.password = ''}

  //  Get Rid Of Any Bogus Properties - cleaning up Data property of the User object. * Overidding/Updating Data property *
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password
  }
}

//  Validate The User Input Form
User.prototype.validate = function () {
  if (this.data.username === '') { this.errors.push('You must provide a username.') }
  if (this.data.username != '' && !validator.isAlphanumeric(this.data.username)) {this.errors.push('Username can only contain letters and numbers')}
  if (!validator.isEmail(this.data.email)) { this.errors.push('You must provide a valid email address.') }
  if (this.data.password === '') { this.errors.push('You must provide a password.') }
  if (this.data.password.length > 0 && this.data.password.length < 12) { this.errors.push('Password must be at least 12 characters.') }
  if (this.data.password.lenght > 50) { this.errors.push('Password cannot exceed 50 characters') }
  if (this.data.username.length > 0 && this.data.username.length < 3) { this.errors.push('Username must be at least 3 characters.') }
  if (this.data.username.lenght > 30) { this.errors.push('Username cannot exceed 30 characters') }
}

User.prototype.login = function () {
  //  Create a promise give it a func as an argument
  return new Promise((resolve, reject) => {
    this.cleanUp()
    //  Obj that represents our DB collection
    //  MongoDB findOne() has a callback function - Which is also a promise. We want to be able to access the Document that the Database might find.
    //  So we pass through the variable attemptedUser (which will have data attached to it as it is part of the MongoDB callback)
    usersCollection.findOne({username: this.data.username}).then( (attemptedUser) => {
      //  bcrypt will perform the password comparison
      if (attemptedUser && bcrypt.compareSync(this.data.password,attemptedUser.password)) { 
        resolve("Congrats")
    } else {
        reject("Invalid username / password")
    }
    }).catch(function () {
      reject('Please try again later')
    })
  })
}

User.prototype.register = function () {
  // Step 1 Validate User Data
  this.cleanUp()
  this.validate()  
  // Step 2 Only If there are no validation errors then save the user data into a User DB 

  //  Check if there are errors in the errors array
  if (!this.errors.length) {
    //  Hash User Password 
    let salt = bcrypt.genSaltSync(10)
    this.data.password = bcrypt.hashSync(this.data.password, salt)
    //  Store new user object in the DB 
    usersCollection.insertOne(this.data)
  }
}

module.exports = User
