const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const { initializeApp } = require('firebase-admin/app');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(cors());
app.use(bodyParser.json());


var admin = require("firebase-admin");

var serviceAccount = require("./configs/timeline-projects-firebase-adminsdk-1uq4e-788a680909.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://timeline.firebaseio.com"

});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.na2s6.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const watchCollection = client.db(`${process.env.DB_NAME}`).collection('watches');
    const ordersCollection = client.db(`${process.env.DB_NAME}`).collection('orders');
    console.log('Database connected successfully');

    app.get('/watches', (req, res) => {
        watchCollection.find()
            .toArray((err, watches) => {
                res.send(watches);
            })
    })

    app.get('/product/:id', (req, res) => {
        watchCollection.find({ _id: ObjectId(req.params.id) })
            .toArray((err, watches) => {
                res.send(watches[0]);
            })
    })

    app.post('/addWatch', (req, res) => {

        const newWatch = req.body;

        console.log('adding new watch', newWatch);
        watchCollection.insertOne(newWatch)
            .then(result => {
                console.log('inserted watch', result.insertedCount)
                res.send(result.insertedCount > 0)
            })
    })

    app.patch('update/:id', (req, res) => {
        watchCollection.updateOne({ _id: ObjectId(req.params.id) })
    })

    app.delete('/delete/:id', (req, res) => {
        console.log(req.params.id)
        watchCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                console.log(result)
            })
    })

    // Orders

    app.post('/addOrder', (req, res) => {
        const order = req.body;
        ordersCollection.insertOne(order)
            .then(result => {
                console.log(result.insertedCount);
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/orders', (req, res) => {
        console.log(req.headers.authorization);
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log({ idToken });
            admin.auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email
                    console.log({ tokenEmail });
                    if (tokenEmail === queryEmail) {
                        ordersCollection.find({ email: queryEmail })
                            .toArray((err, orders) => {
                                res.send(orders);
                            })
                    }
                    else {
                        res.status(401).send('Un-authorized Access');
                    }
                })
                .catch((error) => {
                    res.status(401).send('Un-authorized Access');
                });
        }
        else {
            res.status(401).send('Un-authorized Access');
        }
    })
});



app.get('/', (req, res) => {
    res.send('Timeline Server!')
})

app.listen(port, () => {
    console.log(`Timeline app listening at http://localhost:${port}`)
})