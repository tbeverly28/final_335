const express = require("express"); // Express module
const router = express.Router(); // Handle mini endpoints
const path = require("path"); // Path module
const { MongoClient, ServerApiVersion } = require("mongodb"); // Database module (MongoDB)
require("dotenv").config({ path: path.resolve(__dirname, ".env") }); // To use .env

// Routing: Home
router.get("/", (request, response) => {
    main(request, response);
});
router.post("/", (request, response) => {
    main(request, response);
});

async function main(req, res) {
    const movies = await loadCards();
    // cant pass stringified json unless I deal with the single quotes
    const escaped = JSON.stringify(movies).replaceAll("'", "\\'");
    res.render("home", { escaped });
}

/****** DATABASE RETRIEVAL CODE ******/
// URI
const user = process.env.MONGO_DB_USERNAME;
const pass = process.env.MONGO_DB_PASSWORD;
const uri = `mongodb+srv://${user}:${pass}@cluster0.0inlf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Database and Collection
const databaseAndCollection = {
    db: process.env.MONGO_DB_NAME,
    collection: process.env.MONGO_COLLECTION_ALL,
};

// initial load movie cards
async function loadCards() {
    const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 }); // DB client

    try {
        await client.connect();
        // empty filter (get all)
        let filter = {};
        // find all movies
        const cursor = client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);
        // results -> array
        const movies = await cursor.toArray();
        console.log(`Found: ${movies.length} movies for Home Page`);
        // return movies array
        return movies;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

module.exports = router;