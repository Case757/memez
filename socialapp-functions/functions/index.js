const functions = require('firebase-functions');
const app = require('express')()
const FBAuth = require('./util/fbAuth')

const { getAllMemes, postOneMeme } = require('./handlers/memes')
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users')


//Scream routes
app.get('/memes', getAllMemes);
app.post('/meme', FBAuth, postOneMeme)

//Use routes
app.post('/signup', signup)
app.post('/login', login)   
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)


exports.api = functions.https.onRequest(app);
