const userCollections = require('../db').db().collection('users')
const followsCollections = require('../db').db().collection('follows')
const ObjectID = require('mongodb').ObjectID

const User = require('./User')

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
    try {

        return new Promise( async (resolve, reject) => {

            this.cleanUp()
            await this.validate('create')

            if (!this.errors.length) {
                await followsCollections.insertOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
                resolve()
            }

        })
        
    } catch (error) {

        reject(this.errors)
        console.log(error)
    }
}

Follow.prototype.delete = function () {

    try {

        return new Promise( async (resolve, reject) => {

            this.cleanUp()
            await this.validate('delete')

            if (!this.errors.length) {
                await followsCollections.deleteOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
                resolve()
            }

        })
        
    } catch (error) {
        reject(this.errors)
        console.log(error)
    }
 
}

Follow.isVisitorFollowing = async function(followedId, visitorId) {

    try{

        let followDoc = await followsCollections.findOne({followedId: followedId, authorId: new ObjectID(visitorId)})

        if (followDoc) {
            return true
        } else{
            return false
        }

    }catch (error) {

        false
        console.log(error)
    }

}

Follow.getFollowersById = function(id) {

    return new Promise( async (resolve, reject) => {
        try {

            let followers = await followsCollections.aggregate([
                {$match: {followedId: id}},
                {$lookup: {from: 'users', localField: 'authorId', foreignField: '_id', as: 'userDoc'}},
                {$project: {
                    username:{$arrayElemAt:['$userDoc.username', 0]},
                    email:{$arrayElemAt:['$userDoc.email', 0]}
                }}
            ]).toArray()
            followers = followers.map(function (follower) {
                let user = new User(follower, true)
                return {username:follower.username, avatar: user.avatar}
            })
            resolve(followers)
            
        } catch (error) {
            reject(error)
            console.log(error)

        }
        
    })
}


Follow.getFolloweringById = function(id) {

    return new Promise( async (resolve, reject) => {
        try {

            let followers = await followsCollections.aggregate([
                {$match: {authorId: id}},
                {$lookup: {from: 'users', localField: 'followedId', foreignField: '_id', as: 'userDoc'}},
                {$project: {
                    username:{$arrayElemAt:['$userDoc.username', 0]},
                    email:{$arrayElemAt:['$userDoc.email', 0]}
                }}
            ]).toArray()
            followers = followers.map(function (follower) {
                let user = new User(follower, true)
                return {username:follower.username, avatar: user.avatar}
            })
            resolve(followers)
            
        } catch (error) {
            reject(error)
            console.log(error)
        }
        
    })
}

Follow.countFollowersById = function(id) {
    try {

        return new Promise(async (resolve, reject) => {
            let followerCount = await followsCollections.countDocuments({followedId: id})
            resolve(followerCount)
        })
        
    } catch (error) {
        reject(error)
        console.log(error)
    }

}

Follow.countFollowingById = function(id) {
    try{

        return new Promise(async (resolve, reject) => {
            let count = await followsCollections.countDocuments({authorId: id})
            resolve(count)
        })

    } catch(error) {
        reject(error)
        console.log(error)
    }
}

module.exports = Follow
