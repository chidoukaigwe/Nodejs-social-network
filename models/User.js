const bcrypt = require('bcryptjs')
//  usersColletion variable we are able to perform CRUD on
const usersCollection = require('../db').db().collection('users')
//  Validate User Input [For Signup Forms]
const validator = require('validator')
//  MD5 for passwords and Gravatar
const md5 = require('md5')

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
  return new Promise(async (resolve, reject) => {
    if (this.data.username === '') { this.errors.push('You must provide a username.') }
    if (this.data.username != '' && !validator.isAlphanumeric(this.data.username)) {this.errors.push('Username can only contain letters and numbers')}
    if (!validator.isEmail(this.data.email)) { this.errors.push('You must provide a valid email address.') }
    if (this.data.password === '') { this.errors.push('You must provide a password.') }
    if (this.data.password.length > 0 && this.data.password.length < 12) { this.errors.push('Password must be at least 12 characters.') }
    if (this.data.password.lenght > 50) { this.errors.push('Password cannot exceed 50 characters') }
    if (this.data.username.length > 0 && this.data.username.length < 3) { this.errors.push('Username must be at least 3 characters.') }
    if (this.data.username.lenght > 30) { this.errors.push('Username cannot exceed 30 characters') }
  
    //  Only if username is valid then check to see if its already taken
    if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
      //  Assign A Variable & Check DB For Username Input - Mongo - findOne - returns a promise
      let usernameExists = await usersCollection.findOne({username: this.data.username})
      //  If UsernameExists run the error
      if (usernameExists) {this.errors.push('that username is already taken')}
    }
  
      //  Only if email is valid then check to see if its already taken
      if (validator.isEmail(this.data.email)) {
        //  Assign A Variable & Check DB For email Input - Mongo - findOne - returns a promise
        let emailExists = await usersCollection.findOne({email: this.data.email})
        //  If emailExists run the error
        if (emailExists) {this.errors.push('That email is already being used')}
      }
      resolve()
  })
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
        //  We need to bring the attempting users full data credentials to the request when logging in - as the above code is simply for checking for username
        this.data = attemptedUser
        //  Populate a property on our User object, called Avatar
        this.getAvatar()
        resolve("Congrats")
    } else {
        reject("Invalid username / password")
    }
    }).catch(function () {
      reject('Please try again later')
    })
  })
}

User.prototype.register = function() {
  return new Promise(async (resolve, reject) => {
    // Step 1 Validate User Data
    this.cleanUp()
    await this.validate()  
    // Step 2 Only If there are no validation errors then save the user data into a User DB 
  
    //  Check if there are errors in the errors array
    if (!this.errors.length) {
      //  Hash User Password 
      let salt = bcrypt.genSaltSync(10)
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      //  Store new user object in the DB 
      await usersCollection.insertOne(this.data)
      this.getAvatar()
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

User.prototype.getAvatar = function() {
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

module.exports = User
