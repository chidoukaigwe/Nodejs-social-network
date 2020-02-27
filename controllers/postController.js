const Post = require('../models/Post')

// Show Create Post Screen To Logged In Users
exports.viewCreateScreen = function(req, res) {
   res.render('create-post') 
}

exports.create = function (req, res) {
   let post = new Post(req.body, req.session.user._id)
   post.create().then(function () {
      res.send('New Post Created')
   }).catch(function (errors) {
      res.send(errors)
   })
}

exports.viewSingle = async function(req, res) {

   try{
      // Using express request paramters 
      // Looking for the parameter .id set in the Router file 
      let post = await Post.findSingleById(req.params.id)
      res.render('single-post-screen', {post: post})
   }catch{
      res.send('404 Template will go here')
   }
}
