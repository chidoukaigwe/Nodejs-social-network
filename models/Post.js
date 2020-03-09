const postsCollection = require('../db').db().collection('posts')
const followsCollection = require('../db').db().collection('follows')
const sanitizeHTML = require('sanitize-html')
//  Store ID's in Mongo Object ID Format 
const ObjectID = require('mongodb').ObjectID

const User = require('./User')


// Constructor Function
let Post = function (data, userid, requestedPostId) {

    this.data = data
    this.errors = []
    this.userid = userid
    this.requestedPostId = requestedPostId

}


Post.prototype.cleanUp = function() {

    if (typeof(this.data.title) != 'string') {this.data.title = ''}
    if (typeof(this.data.body) != 'string') {this.data.body = ''}


    this.data = {
      title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),  
      body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
      createdDate: new Date(),
      author: ObjectID(this.userid)
    }

}

Post.prototype.validate = function() {

        if(this.data.title == '') {
            this.errors.push("You must provide a title")
        }

        if(this.data.body == '') {
            this.errors.push("You must provide post content")
        }
    

}

Post.prototype.create = function() {

    return new Promise( (resolve,reject) => {
        this.cleanUp()
        this.validate()

        //  Check errors array 

        if (!this.errors.length) {
            //  Save post into database - Mongo DB returns promises
            postsCollection.insertOne(this.data).then( (info) => {
                //Mongo DB has an array called ops
                resolve(info.ops[0]._id)
            }).catch(() => {
                this.errors.push('Please try again later')
                reject(this.errors)
            })
            
        } else{
            reject(this.errors)
        }

    })

}

Post.prototype.update = function () {
    return new Promise(async(resolve,reject) => {

        try{
            let post = await Post.findSingleById(this.requestedPostId, this.userid)
             if (post.isVisitorOwner) {
                //Actually Update The DB
                let status = await this.actuallyUpdate()
                resolve(status)
             } else{
                reject()
             }
        }catch(err){
            reject(err)
        }

    })
}

Post.prototype.actuallyUpdate = function () {
    return new Promise (async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}} )
            resolve('success')
        }else{
            resolve('failure')
        }
    })
}

Post.reusablePostQuery = function(uniqueOperations, visitorId) {
    return new Promise( async function (resolve, reject) {

        //  Concat returns a new array and with that arg passed inside its paranthesis and add it to original array
        let aggOperations = uniqueOperations.concat([
            {$lookup: {from: 'users', localField: 'author', foreignField: '_id', as:'authorDocument'}},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: '$author', //dollar sign author means to MONGOdb use field
                author: {$arrayElemAt: ['$authorDocument', 0]}
            }}
        ])
 
        //Mongo DB CRUD Function 
        //Code needs to return a Promise, because talking to the DB is an async process - that is why we ended the line with toArray() which returns a promise
        //aggregate lets us run mutliple instructions - we pass it an array of multiple DB options
        let posts = await postsCollection.aggregate(aggOperations).toArray()

        // Clean Up Author Prop In Each Post Obj
        posts = posts.map(function(post){
            //post.authorId is a mongo object
            post.isVisitorOwner = post.authorId.equals(visitorId) 
            post.authorId = undefined
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }

            return post
        })
            resolve(posts)
    })
}

Post.findSingleById = function (id, visitorId) {
    return new Promise( async function (resolve, reject) {

        if (typeof(id) != 'string' || !ObjectID.isValid(id)) {
            reject()
            return
        }

        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)

            if (posts.length) {
                console.log(posts[0])
                resolve(posts[0])
            } else {
                reject()
            }
        })
}

Post.findByAuthorId = function(authorId) {

    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        //1 asc / -1 desc 
        {$sort: {createdDate: -1}}
    ])

}

Post.delete = function(postIdToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
      try {
        let post = await Post.findSingleById(postIdToDelete, currentUserId)
        if (post.isVisitorOwner) {
          await postsCollection.deleteOne({_id: new ObjectID(postIdToDelete)})
          resolve()
        } else {
          reject()
        }    
      } catch {
        reject()
      }
    })
  }

Post.search = function (searchTerm) {
    return new Promise( async (resolve, reject) => {
        if (typeof(searchTerm)  == 'string') {
            let posts = await Post.reusablePostQuery([
                // Not looking for exact value match - looking for the text that contains the words from the search term
                {$match: {$text: {$search: searchTerm}}},
                {$sort: {score: {$meta: 'textScore'}}}
            ])
            resolve(posts)
        }else{
            reject()
        }
    })
}

Post.countPostsByAuthor = function(id) {
    return new Promise(async (resolve, reject) => {
        let postCount = await postsCollection.countDocuments({author: id})
        resolve(postCount)
    })
}

Post.getFeed = async function(id) {
    // Create An Array Of The User ID's that the current user follows
    let followedUsers = await followsCollection.find({authorId: new ObjectID(id)}).toArray()
    // Create new array with map() specify a value for that new array which is a function(callback) with a param(that represents each doc)
    followedUsers = followedUsers.map(function(followDoc){
        return followDoc.followedId
    })
    // Look for posts where the author is in the above array of followed users
    // Pass an array of aggregate options
    return Post.reusablePostQuery([
        //Find any post document where the author value is a value that is in our array of followed users
        {$match: {author: {$in:followedUsers}}},
        // negative one -1 means the newest values are at the top
        {$sort: {createdDate: -1}}
    ])
}


module.exports = Post