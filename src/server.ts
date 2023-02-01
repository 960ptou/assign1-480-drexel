import express from "express";

let app = express();
app.use(express.json());

// INSERTED
import {authorRouter} from "./author.route.js"
import {bookRouter} from "./book.route.js"

// run server
app.use("/api", authorRouter);
app.use("/api", bookRouter)
app.use(express.static("public"));


let port = 4000;
let host = "localhost";
let protocol = "http";
app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
});
