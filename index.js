const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();


const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sn1j5xu.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

//middleware
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        const productsCollection = client.db('resellingportal').collection('products');
       
        

        

    }
    finally {

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('resale portal is running')
})
app.listen(port, () => console.log(`resale portal running on ${port}`))