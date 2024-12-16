const path = require("path"); // Define path module
const express = require("express"); // Express module
const app = express(); // app -> request handler function
const { MongoClient, ServerApiVersion } = require("mongodb"); // Database module (MongoDB)
require("dotenv").config({ path: path.resolve(__dirname, ".env") }); // To use .env
const bodyParser = require("body-parser"); /* To handle post parameters */
const portNumber = 4000; // port number

// For routing (local routes folder)
const home = require("./routes/home");
const find = require("./routes/find");
const profile = require("./routes/profile");

/* Initializes request.body with post information */
app.use(bodyParser.urlencoded({ extended: false }));
/* Allows static files usage */
app.use(express.static(path.join(__dirname, 'public')));
/* Use templates */
app.set("views", path.resolve(__dirname, "templates")); // Directory
app.set("view engine", "ejs"); // View/Templating engine

// Landing: Login Page
app.get("/", (request, response) => {
    response.render("login");
});

// Homepage middleware
app.use("/home", home);
// Findpage middleware
app.use("/find", find);
// User Profile middleware
app.use("/profile", profile);

app.listen(portNumber);
// Server start confirmation message
console.log(`Web server started and running at http://localhost:${portNumber}`);

// URI
const user = process.env.MONGO_DB_USERNAME;
const pass = process.env.MONGO_DB_PASSWORD;
const uri = `mongodb+srv://${user}:${pass}@cluster0.0inlf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Database and Collection
const databaseAndCollection = {
    db: process.env.MONGO_DB_NAME,
    collection: process.env.MONGO_COLLECTION_ALL
};

/****** DATABASE INSERTION CODE ******/
// function to handle movies insertion (basically rapidapi fetch call and insert())
async function horrorarGET() {
    // Populate Popular Movies DB (All Pages) (change page= to page=1 or page=2)
    // const url = 'https://horror-archive1.p.rapidapi.com/items/?page=2&max=50&type=film&order_type=popularity&order_sort=ASC';
    // Populate Upcoming Movies DB (Only one page)
    // const url = 'https://horror-archive1.p.rapidapi.com/items/?page=1&max=50&type=film&order_type=upcoming&order_sort=ASC';
    // Populate Recent Movies DB (First 2 pages)
    // const url = 'https://horror-archive1.p.rapidapi.com/items/?page=2&max=50&type=film&order_type=recent&order_sort=ASC';

    const options = {
        method: "GET",
        headers: {
            "x-rapidapi-key": process.env.HORRORAR_API_KEY,
            "x-rapidapi-host": process.env.HORRARAR_API_HOST,
        },
    };
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        // console.log(result);
        await insert(result.results).catch(console.error);
    } catch (error) {
        console.error(error);
    }
}

// Start client, insert movies, close client
async function insert() {
    const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 }); // DB client
    try {
        // connect to client
        await client.connect();
        // enforce unique id rule on both collections
        await client
            .db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .createIndex({ id: 1 }, { unique: true });
        // orginally I had the above repeated but with subcollection instead of collection

        // insert movies into main collection
        // ordered false to continue inserting unique entries even if there's dupes
        const result = await client
            .db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .insertMany(movies, { ordered: false });
        // orginally I had the above repeated but with subcollection instead of collection
    } catch (e) {
        // notify error
        console.error("Duplicate Entries: " + e);
    } finally {
        // close client when done
        await client.close();
    }
}
