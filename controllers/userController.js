//  Bring in User Model
const User = require('../models/User')

//  Bring in Post Model
const Post = require('../models/Post')

// Bring in Follow Model
const Follow = require('../models/Follow')

//  Bring In JSON Web Token Package
const jwt = require('jsonwebtoken')

exports.doesUsernameExist = function(req, res) {

  User.findByUsername(req.body.username).then(() => {
    res.json(true)
  }).catch(() => {
    res.json(false)
  })

}

exports.doesEmailExist = async function(req, res) {

let emailBool = await User.doesEmailExist(req.body.email)

res.json(emailBool)

}

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

  // Retrieve Post Follower & Following Counts
  let postCountPromise =  Post.countPostsByAuthor(req.profileUser._id)
  let followerCountPromise =  Follow.countFollowersById(req.profileUser._id)
  let followingCountPromise =  Follow.countFollowingById(req.profileUser._id)

  // All Method Returns An Array -   // Array Destructing
  let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])

  // Add this onto the request object
  req.postCount = postCount
  req.followerCount = followerCount
  req.followingCount = followingCount

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

//  req & res come from the callback function made within router.js and therefore router.js can pass the two args (req & res)
exports.apiLogin = function (req, res) {
  let user = new User(req.body)
  //  Passing this function as an argument into the login function
  user.login().then(function (result) {
    res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: '7d'}))
  }).catch(function (err) {
    res.json("Sorry your values was not correct")
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

exports.home = async function (req, res) {

try{

  if (req.session.user) {
    //Fetch Feed Of Posts For Current User
    let posts = await Post.getFeed(req.session.user._id)
    res.render('home-dashboard', {posts: posts})
  } else {
    res.render('home-guest', {regErrors: req.flash('regErrors')})
  }

}catch(error){
  res.render('home-dashboard2')
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
    currentPage:"posts",
    posts: posts,
    title: `Profile for ${req.profileUser.username}`,
    profileUsername: req.profileUser.username,
    profileAvatar: req.profileUser.avatar,
    isFollowing: req.isFollowing,
    isVisitorsProfile: req.isVisitorsProfile,
    counts: { postCount: req.postCount, followerCount: req.followerCount,followingCount: req.followingCount }
  })
  
}).catch(function (error){
  res.render('404' . error)
})

}

exports.profileFollowersScreen = async function (req, res) {

  try {
    let followers = await Follow.getFollowersById(req.profileUser._id)
    res.render('profile-followers', {
      currentPage:"followers",
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: { postCount: req.postCount, followerCount: req.followerCount,followingCount: req.followingCount }
    })
  } catch (error) {
      error
  }

}

  exports.profileFollowingScreen = async function (req, res) {

    try {
      let following = await Follow.getFolloweringById(req.profileUser._id)
      res.render('profile-following', {
        currentPage:"following",
        following: following,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: { postCount: req.postCount, followerCount: req.followerCount,followingCount: req.followingCount }
      })
    } catch (error) {
        res.render('404', error)
    }
  
  }

  exports.apiMustBeLoggedIn = function (req, res, next) {
    try {
      req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
      next()
    } catch (error) {
      res.json('Sorry you must provide a valid token')
    }
  }

  exports.apiGetPostsByUsername = async function (req, res) {
    try {
      let authorDoc = await User.findByUsername(req.params.username)
      let posts = await Post.findByAuthorId(authorDoc._id)
      res.json(posts)
    } catch (error) {
      res.json("Sorry invalid user request")
    }
  }