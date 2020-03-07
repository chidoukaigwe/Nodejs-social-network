//  Bring in User Model
const User = require('../models/User')

//  Bring in Post Model
const Post = require('../models/Post')

// Bring in Follow Model
const Follow = require('../models/Follow')


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

exports.sharedProfileData = async function (req, res, next) {

  let isVisitorsProfile = false

  // next() calls the next function assigned to the route
  let isFollowing = false

  if (req.session.user) {
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
  }

  // Add this onto the request object
  req.isFollowing = isFollowing
  req.isVisitorsProfile = isVisitorsProfile

  next()

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
    res.render('home-guest', {regErrors: req.flash('regErrors')})
  }
}

exports.ifUserExists = function(req, res, next) {

  User.findByUsername(req.params.username).then(function (userDocument) {
    // Add new property on the request object called UserObject
    req.profileUser = userDocument
    next()
  }).catch(function () {
    res.render('404')
  })

}

exports.profilePostsScreen = function(req, res) {
//  Ask our post model for posts by a certain author id
Post.findByAuthorId(req.profileUser._id).then(function (posts) {

  res.render('profile', {
    posts: posts,
    profileUsername: req.profileUser.username,
    profileAvatar: req.profileUser.avatar,
    isFollowing: req.isFollowing,
    isVisitorsProfile: req.isVisitorsProfile
  })
  
}).catch(function (){
  res.render('404')
})

}

exports.profileFollowersScreen = async function (req, res) {

  try {
    let followers = await Follow.getFollowersById(req.profileUser._id)
    res.render('profile-followers', {
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile
    })
  } catch (error) {
      res.render('404', error)
  }

}

  