const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// console.log(process.env.DB_USER);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sj6rkpp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db("toyStore");
        const toysCollection = database.collection("toys");
        const todayCollection = database.collection("todayDeal");
        app.get('/api/toys', async (req, res) => {
            const query = req.query;
            const limit = parseInt(query.limit) || 10;
            const page = parseInt(query.page) || 0;
            const skip = (page - 1) * limit;
            const cursor = toysCollection.find().skip(skip).limit(limit);
            const result = await cursor.toArray();
            res.send(result);
        });
        // ! Make Search API
        app.get('/api/search', async (req, res) => {
            const query = req.query;
            const limit = parseInt(query.limit) || 10;
            const page = parseInt(query.page) || 0;
            const skip = (page - 1) * limit;
            const cursor = toysCollection.find({ toyName: { $regex: query.search, $options: 'i' } }).skip(skip).limit(limit);
            const result = await cursor.toArray();
            res.send(result);
        });
        // ! Get All Toys 
        app.get('/api/all-toys', async (req, res) => {
            const cursor = toysCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        // ! total toys
        app.get('/api/total-toys', async (req, res) => {
            const result = await toysCollection.estimatedDocumentCount();
            res.send({ totalToys: result });
        })
        app.post('/api/add-toy', async (req, res) => {
            const toy = req.body;
            const result = await toysCollection.insertOne(toy);
            // console.log(toy);
            res.send(result);
        });

        // ! Get Single Toy 
        app.get('/api/toy/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toysCollection.findOne(query);
            res.send(result);
        });

        // ! GET TOYS BASED ON USER EMAIL 
        app.get('/api/user-toys', async (req, res) => {
            const query = req.query;
            const sort = parseInt(query.sort) || -1;
            const limit = parseInt(query.limit);
            const page = parseInt(query.page);
            const skip = (page - 1) * limit;
            if (!limit && !page) {
                const cursor = toysCollection.find({ email: query.email });
                const result = await cursor.toArray();
                res.send(result);
            } else {
                const cursor = toysCollection.find({ email: query.email }).sort({ price: sort }).skip(skip).limit(limit);
                const result = await cursor.toArray();

                res.send(result);
            }
        });

        // ! Delete Toy
        app.delete('/api/delete-toy/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toysCollection.deleteOne(query);
            res.send(result);
        });
        //  * Get Today's Deal data 
        app.get('/api/today-deal', async (req, res) => {
            const cursor = todayCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        // ! Update Toy
        app.put('/api/update-toy/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const updatedToy = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    toyName: updatedToy.toyName,
                    price: updatedToy.toyPrice,
                    description: updatedToy.toyDescription,
                    photo: updatedToy.toyImage,
                    email: updatedToy.email,
                    ratings: updatedToy.ratings
                },
            };
            const result = await toysCollection.updateOne(query, updateDoc, options);
            res.send(result);
        });
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
       
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('TOYS SERVER IS RUNNING ');
});


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});