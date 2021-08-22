const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { MongoClient } = require('mongodb');
const ObjectID = require('mongodb').ObjectID;
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(cors());
app.use(bodyParser.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.na2s6.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const watchCollection = client.db('watchMaster').collection('watches');
    console.log('Database connected successfully');

    app.get('/watches', (req, res) => {
        watchCollection.find()
        .toArray((err, watches) => {
            res.send(watches);
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
});



app.get('/', (req, res) => {
    res.send('Watch Master Server!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})