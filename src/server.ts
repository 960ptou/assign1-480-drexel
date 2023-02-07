import express from "express";

let app = express();
app.use(express.json());

// INSERTED
import {authorRouter} from "./author.route.js"
import {bookRouter} from "./book.route.js"
import { credientialRoute } from "./crediential.route.js";
import cookieParser from "cookie-parser";
// run server
app.use("/api",cookieParser(), authorRouter);
app.use("/api", cookieParser(),bookRouter)
app.use("/crediential",cookieParser(),credientialRoute)
app.use(express.static("public"));


let port = 3000;
let host = "localhost";
let protocol = "http";
app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
});
