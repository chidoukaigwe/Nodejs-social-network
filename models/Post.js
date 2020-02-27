const postsCollection = require('../db').db().collection('posts')
//  Store ID's in Mongo Object ID Format 
const ObjectID = require('mongodb').ObjectID
// Constructor Function
let Post = function (data, userid) {

    this.data = data
    this.errors = []
    this.userid = userid

}


Post.prototype.cleanUp = function() {

    if (typeof(this.data.title) != 'string') {this.data.title = ''}
    if (typeof(this.data.body) != 'string') {this.data.body = ''}

    // Get Rid Of Any Bogus Properties

    this.data = {
      title: this.data.title.trim(),  
      body: this.data.body.trim(),
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
            postsCollection.insertOne(this.data).then( () => {
                resolve()
            }).catch(() => {
                this.errors.push('Please try again later')
                reject(this.errors)
            })
            
        } else{
            reject(this.errors)
        }

    })

}

Post.findSingleById = function (id) {
    return new Promise( async function (resolve, reject) {
        if (typeof(id) != 'string' || !ObjectID.isValid(id)) {
            reject()
            return
        } else {
            //  Mongo DB CRUD Function 
            //  Check requested ID against _id of the database
            let post = await postsCollection.findOne({_id: new ObjectID(id)})
            if (post) {
                resolve(post)
            } else {
                reject()
            }
        }
    })
}

module.exports = Post