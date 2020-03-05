const Post = require('../models/Post')

// Show Create Post Screen To Logged In Users
exports.viewCreateScreen = function(req, res) {
   res.render('create-post') 
}

exports.create = function (req, res) {
   let post = new Post(req.body, req.session.user._id)
   post.create().then(function (newId) {
      req.flash('success', 'New post successfully created.')
      req.session.save(() => res.redirect(`/post/${newId}`))
   }).catch(function (errors) {
      errors.forEach(error => req.flash('errors', error))
      req.session.save(() => res.redirect('/create-post'))
   })
}

exports.viewSingle = async function(req, res) {

   try{
      // Using express request paramters 
      // Looking for the parameter .id set in the Router file 
      let post = await Post.findSingleById(req.params.id, req.visitorId)
      res.render('single-post-screen', {post: post})
   }catch (err) {
      res.render('404')
   }
}

exports.viewEditScreen = async function (req, res) {
  try{
   let post = await Post.findSingleById(req.params.id)
   if (post.authorId == req.visitorId) {
      res.render('edit-post', {post: post})
   } else {
      req.flash('errors', 'You do not have permission to perform that action')
      req.session.save(() => res.redirect('/'))
   }
  }catch (err){
   res.render('404', err)
  }
}

exports.edit = function (req, res) {
   let post = new Post(req.body, req.visitorId, req.params.id)
   post.update().then( (status) => {
      // Post was successfully updated in the database 
      // Or user did have permission but there were validation errors
      if (status == 'success') {
         // post was updated in DB
         req.flash('success', 'Post sucessfully updated')
         req.session.save(function () {
            res.redirect(`/post/${req.params.id}/edit`)
         })
      } else{
         post.errors.forEach(function(error) {
            req.flash('errors', error)
         })
         req.session.save(function () {
            res.redirect(`/post/${req.params.id}/edit`)
         })
      }
   }).catch( () => {
      // a post with the requested id doesnt exist 
      // the current visitor is not the owner of the post
      req.flash('errors', 'You do noy have permission to peform that action')
      req.session.save(function () {
         res.redirect('/')
      })
   })
}

exports.search = function(req, res) {
   Post.search(req.body.searchTerm).then( posts => {
      res.json(posts)
   }).catch(() => {
      res.json([])
   })
}