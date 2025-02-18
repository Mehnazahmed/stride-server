const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;

const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sn1j5xu.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

//middleware
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const productsCollection = client
      .db("resellingportal")
      .collection("products");
    const productCategories = client
      .db("resellingportal")
      .collection("productCategories");
    const bookingsCollection = client
      .db("resellingportal")
      .collection("bookings");
    const usersCollection = client.db("resellingportal").collection("users");
    const addedproductscollection = client
      .db("resellingportal")
      .collection("addedproducts");

    const verifyAdmin = async (req, res, next) => {
      console.log("inside verifyAdmin", req.decoded.email);
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.get("/products", async (req, res) => {
      const query = {};
      const products = await productsCollection.find(query).toArray();

      res.send(products);
    });

    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);

      const query = { category_id: id };
      const productCategory = await productsCollection.find(query).toArray();

      console.log(productCategory);
      res.send(productCategory);
    });

    app.get("/pCategories", async (req, res) => {
      const query = {};
      const pCategories = await productCategories.find(query).toArray();

      res.send(pCategories);
    });

    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.get("users/:id", async (req, res) => {
      const userId = req.params.id;
      try {
        const user = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });
        res.send(user);
      } catch (error) {
        res.status(500).send({ message: "Error fetching user data" });
      }
    });
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };

      try {
        console.log(`Fetching user with email: ${email}`);
        const user = await usersCollection.findOne(query);
        if (user) {
          res.send(user);
        } else {
          res.status(404).send({ message: "User not found" });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send({ message: "Error fetching user data" });
      }
    });

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "24hr",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "seller" });
    });

    app.get("/users/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isBuyer: user?.role === "buyer" });
    });

    app.put("/users/admin/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;

      let query = {}; // Default query to fetch all bookings

      // If email parameter is provided, fetch bookings for that email
      if (email) {
        if (email !== decodedEmail) {
          return res.status(403).send({ message: "Forbidden access" });
        }
        query = { email: email };
      }

      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    app.get("/bookings/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const query = {
        email: booking.email,
      };

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    app.get("/addedproducts", verifyJWT, async (req, res) => {
      const query = {};
      const newAddedProducts = await addedproductscollection
        .find(query)
        .toArray();
      res.send(newAddedProducts);
    });

    app.post("/addedproducts", verifyJWT, async (req, res) => {
      const product = req.body;
      const result = await addedproductscollection.insertOne(product);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("resale portal is running");
});
app.listen(port, () => console.log(`resale portal running on ${port}`));
