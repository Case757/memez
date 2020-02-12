var firebaseConfig = {
    apiKey: "AIzaSyD6ztUA6CrrdhtH2KhQM7HsVrYutyOIorc",
    authDomain: "socialapp-46dce.firebaseapp.com",
    databaseURL: "https://socialapp-46dce.firebaseio.com",
    projectId: "socialapp-46dce",
    storageBucket: "socialapp-46dce.appspot.com",
    messagingSenderId: "829826223130",
    appId: "1:829826223130:web:de1736c481f8fe840d55a3",
    measurementId: "G-744G2RJH4B"
  };
const functions = require('firebase-functions');
const app = require('express')()
const admin = require('firebase-admin')

const firebase = require('firebase')
firebase.initializeApp(firebaseConfig)
admin.initializeApp()

const db = admin.firestore()

app.get('/memes', (req, resp) => {
    db
    .firestore()
    .collection('memes')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
        let memes = [];
        data.forEach(doc => {
            memes.push({
                memeId: doc.id,
                body: doc.data().body,
                useHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
        });
        return resp.json(memes)
    })
    .catch(err => console.error(err))
})

app.post('/meme', (req, resp) => {
   const newMeme = {
       body: req.body.body, 
       userHandle: req.body.userHandle,
       createdAt: (new Date().toISOString())
   };

    db
        .firestore()
        .collection('memes')
        .add(newMeme)
        .then((doc) => {
            resp.json({ message: `document ${doc.id} created succesfully` })
    })
    .catch(err => {
        resp.status(500).json({ error: 'something went wrong' })
        console.error(err)
    })
})

const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;    if(email.match(emailRegEx)) return true;
    else return false
}

const isEmpty = (string) => {
    if(string.trim() === '') return true
    else return false;
}

//Signup route validate data
app.post('/signup', (req, res) => {
const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
};

let errors = {}
if(isEmpty(newUser.email)) {
    errors.email = 'Must not be empty'
} else if(!isEmail(newUser.email)){
    errors.email = 'Must be a valid email address'
}

if (isEmpty(newUser.password)) errors.password = 'Must not be empty'
if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match';
if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty'

if(Object.keys(errors).length > 0) return res.status(400).json(errors)

let token, userId;
db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
        if(doc.exists){
            return res.status(400).json({ handle: 'this handle is already taken'} );
        } else {
            return firebase
                .auth()
                .createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
    })
    .then(data => {
        userId= data.user.uid
        return data.user.getIdToken();
    })
    .then(idToken => {
        token = idToken
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            userId
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    })
    .then(() => {
        return res.status(201).json({ token });
    })
    .catch(err => {
        console.error(err);
        if(err.code === "auth/email-already-in-use") {
            return res.status(400).json({ email: 'Email is already in use' })
        } else {
            return res.status(500).json({ error: err.code })
        }
    })
})

app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    let errors = {};

    if(isEmpty(user.email)) errors.email = 'Must not be empty'
    if(isEmpty(user.password)) errors.password = 'Must not be empty'

    if (Object.keys(errors).length > 0) {
        return res.status(400).json(errors);
    }

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.getIdToken()
        })
        .then(token => {
            return res.json({token});
        })
        .catch(err => {
            console.error(err)
            if(err.code === 'auth/wrong-password')
            return res.status(500).json({ general: 'Wrong credentials, please try again'})
            else return res.status(500).json({ error: err.code });
        })
})
    


exports.api = functions.https.onRequest(app);
