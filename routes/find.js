const express = require("express"); // Express module
const router = express.Router(); // Handle mini endpoints
const path = require("path"); // Path module
const { MongoClient, ServerApiVersion } = require("mongodb"); // Database module (MongoDB)
require("dotenv").config({ path: path.resolve(__dirname, ".env") }); // To use .env
const bodyParser = require("body-parser"); /* To handle post parameters */

/* Initializes request.body with post information */
router.use(bodyParser.urlencoded({ extended: false }));
router.use(express.json());

// Routing: Get Recommendations (Find)
router.get("/", (request, response) => {
    main(request, response);
});

// Post request, add to profile list 
router.post("/addtolist", (request, response) => {
    const data = request.body.jsondata;
    const post_success_status = 200;
    if (!data) {
        return response.status(400).send("Missing Data");
    }
    response.status(post_success_status);

    const movie = JSON.parse(data);
    addToList(movie);
});

async function main(req, res) {
    const movies = await loadCards();
    // cant pass stringified json unless I deal with the single quotes
    const escaped = JSON.stringify(movies).replaceAll("'", "\\'");
    res.render("find", { escaped });
}


// URI
const user = process.env.MONGO_DB_USERNAME;
const pass = process.env.MONGO_DB_PASSWORD;
const uri = `mongodb+srv://${user}:${pass}@cluster0.0inlf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Database and Collection
const databaseAndCollection = {
    db: process.env.MONGO_DB_NAME,
    collection: process.env.MONGO_COLLECTION_ALL,
    usercollection: process.env.MONGO_COLLECTION_PROFILE,
};

/****** DATABASE RETRIEVAL CODE (ALL MOVIES)******/
// load movie cards
async function loadCards() {
    const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 }); // DB client

    try {
        await client.connect();
        // filter movies in user's profile by id then map them so that I only get ids
        const uniqueEntries = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.usercollection)
            .find({}, { id: 1, _id: 0 })
            .toArray();
        const uniqueIDS = uniqueEntries.map(movie => movie.id);

        // find all movies in all movies collection that the user doesnt have saved already
        /* mongodb $nin documentation: selects the documents where: 
                the specified field value is not in the specified array or
                the specified field does not exist. */
        const cursor = client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find({ id: { $nin: uniqueIDS } });

        // results -> array
        const movies = await cursor.toArray();
        console.log(`Found: ${movies.length} movies for Find Page`);
        // return movies array
        return movies;
    } catch (e) {
        console.error("Finding movies for Find Page failed: " + e);
    } finally {
        await client.close();
    }
}
/****** DATABASE UPDATE CODE (USERS MOVIES)******/
async function addToList(movie) {
    const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 }); // DB client
    try {
        await client.connect();
        await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.usercollection)
            .insertOne(movie);
        console.log(`Successful Entry of ${movie.title}`);
    } catch (e) {
        console.error("Entry Insertion to user db failed: " + e);
    } finally {
        await client.close();
    }
}

module.exports = router;