//  Constructor Function - For User Object
let User = function (data) {
//  User Object Properties
  this.data = data
  this.errors = []
}

User.prototype.validate = function () {
  if (this.data.username === '') { this.errors.push('You must provide a username.') }
  if (this.data.email === '') { this.errors.push('You must provide a valid email address.') }
  if (this.data.password === '') { this.errors.push('You must provide a password.') }
  if (this.data.password.length > 0 && this.data.password.length < 12) { this.errors.push('Password must be at least 12 characters.') }
  if (this.data.password.lenght > 100) { this.errors.push('Password cannot exceed 100 characters') }
  if (this.data.username.length > 0 && this.data.username.length < 3) { this.errors.push('Username must be at least 3 characters.') }
  if (this.data.username.lenght > 30) { this.errors.push('Username cannot exceed 30 characters') }
}

User.prototype.register = function () {
  // Step 1 Validate User Data
  this.validate()  
  // Step 2 Only If there are no validation errors then save the user data into a User DB 

}

module.exports = User
