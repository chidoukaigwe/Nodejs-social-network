const userCollections = require('../db').db().collection('users')
const followsCollections = require('../db').db().collection('follows')
const ObjectID = require('mongodb').ObjectID

let Follow = function(followedUsername, authorId) {

    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors = []


}


Follow.prototype.cleanUp = function() {

    if (typeof(this.followedUsername) != 'string') {
        this.followedUsername = ""
    }

}

Follow.prototype.validate = async function(action) {

    // FollowedUsername must exist in database
    let follwedAccount = await userCollections.findOne({username: this.followedUsername})
    // If FollowedUsername Does Exist Assign The Resulting Users ID to a variable
    if (follwedAccount) {
         this.followedId = follwedAccount._id
    } else {
        this.errors.push('You cannot follow a user that does not exist')
    }

    let doesFollowAlreadyExists = await followsCollections.findOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})

    if (action == 'create') {
        if (doesFollowAlreadyExists) {
            this.errors.push('You are already following this user')
        }
    } 


    if (action == 'delete') {
        if (!doesFollowAlreadyExists) {
            this.errors.push('You cannot stop following someone you do not already follow')
        }
    } 

    //Should not be able to follow yourself
    if (this.followedId.equals(this.authorId)) {this.errors.push('You cannot follow yourself')}
}

Follow.prototype.create = function () {
    return new Promise( async (resolve, reject) => {
        this.cleanUp()
        await this.validate('create')

        if (!this.errors.length) {
            await followsCollections.insertOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
            resolve()
        } else{
            reject(this.errors)
        }
    })
}

Follow.prototype.delete = function () {
    return new Promise( async (resolve, reject) => {
        this.cleanUp()
        await this.validate('delete')

        if (!this.errors.length) {
            await followsCollections.deleteOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
            resolve()
        } else{
            reject(this.errors)
        }
    })
}

Follow.isVisitorFollowing = async function(followedId, visitorId) {

    let followDoc = await followsCollections.findOne({followedId: followedId, authorId: new ObjectID(visitorId)})

    if (followDoc) {
        return true
    } else{
        return false
    }


}

module.exports = Follow
