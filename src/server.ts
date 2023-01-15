import express, { Response, Request, NextFunction } from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
    MessageSchema,
    ErrorSchema,
    BookSchema,
    BookArraySchema,
    AuthorSchema,
    AuthorArraySchema,
    Message,
    Error,
    Book,
    BookArray,
    Author,
    AuthorArray,
    BookRequestBody,
    AuthorRequestBody,
    BookArrayResponse,
    AuthorArrayResponse,
    StringResponse,
} from "./types.js";

let app = express();
app.use(express.json());

// create database "connection"
let db = await open({
    filename: "../database.db",
    driver: sqlite3.Database,
});
await db.get("PRAGMA foreign_keys = ON");

app.get("/book/:id?", async (req: Request, res: BookArrayResponse) => {
    // behavior asks that ID has higher priority than query, so if they both exist, I only care about id
    let hasQuery: boolean = Object.keys(req.query).length > 0;
    let hasId: boolean = req.params.id !== undefined;
    let queryString: string = "select * from books";

    if (hasId) {
        queryString = `${queryString} where id=${req.params.id}`;
    } else if (hasQuery) {
        queryString = `${queryString} where ${req.query["query"]}`.split(
            ";"
        )[0]; // avoid sql injection
    }

    try {
        let bks: Book[] = await db.all(queryString);
        return res.json({ books: bks });
    } catch (error) {
        return res.status(400).json({ error: "query error" });
    }
});

app.post("/book", async (req: BookRequestBody, res: StringResponse) => {
    /*
    {
        id : string,
        author_id : string,
        title : string,
        pub_year : string,
        genre : string,
    }
    */
    try {
        BookSchema.parse(req.body);
    } catch (e) {
        return res.status(403).json({ error: "book format invalid" });
    }

    const authorId: string = req.body.author_id;
    const bkid: string = req.body.id;

    // forbid insert without author existing
    let author = await db.get("select * from authors where id = ?", [authorId]);
    if (!author) {
        return res.status(403).json({ error: "author don't exist" });
    }

    // inserting
    let insertStatement = await db.prepare(
        "insert into books(id, author_id, title, pub_year, genre) values (?,?,?,?,?)"
    );
    await insertStatement.bind([
        bkid,
        authorId,
        req.body.title,
        req.body.pub_year,
        req.body.genre,
    ]);
    try {
        await insertStatement.run();
        res.json({ message: "inserted" });
    } catch (error) {
        res.status(400).json({ error: "invalid insertion" });
    }
});

app.delete("/book/:id", async (req: Request, res: StringResponse) => {
    const bkid: string = req.params.id;
    let statement = await db.prepare("delete from books where id=?");
    await statement.bind([bkid]);
    try {
        const result = await statement.run();
        if (result.changes === 0) {
            return res.status(400).json({ message: "nothing was deleted" });
        }
        return res.json({ message: "success book deleted" });
    } catch (error) {
        return res.status(400).json({ error: "delete failed" });
    }
});

function authorExist() {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authorId: string = req.params.id;
        let author: Author | undefined = await db.get(
            "select * from authors where id = ?",
            [authorId]
        );
        res.locals.author = author;
        next();
    };
}

app.get("/author", async (req: Request, res: AuthorArrayResponse) => {
    let allAuthor: Author[] = await db.all("select * from authors");
    return res.json({ authors: allAuthor });
});

app.get(
    "/author/:id",
    authorExist(),
    async (req: Request, res: AuthorArrayResponse) => {
        if (!res.locals.author) {
            return res.status(400).json({ error: "author don't exist" });
        }
        return res.json({ authors: [res.locals.author] });
    }
);

app.post("/author", async (req: AuthorRequestBody, res: StringResponse) => {
    try {
        AuthorSchema.parse(req.body);
    } catch (e) {
        return res.status(403).json({ error: "invalid author format" });
    }

    let insertStatement = await db.prepare(
        "insert into authors(id, name, bio) values (?,?,?)"
    );
    await insertStatement.bind([req.body.id, req.body.name, req.body.bio]);
    try {
        await insertStatement.run();
        res.json({ message: "author inserted" });
    } catch (e) {
        res.status(400).json({ error: "invalid insertion" });
    }
});

app.delete(
    "/author/:id",
    authorExist(),
    async (req: Request, res: StringResponse) => {
        if (!res.locals.author) {
            return res.status(400).json({ error: "author don't exist" });
        }
        // For this, you can't delete if there are still books under this author
        let relatedBook = await db.get(
            "select * from books where author_id = ?",
            [req.params.id]
        );

        if (relatedBook) {
            return res
                .status(400)
                .json({
                    error: "author can't be deleted because a book is related to this author",
                });
        }

        let statement = await db.prepare("delete from authors where id=?");
        await statement.bind([req.params.id]);
        try {
            await statement.run();
            return res.json({ message: "author deleted" });
        } catch (error) {
            return res.status(500).json({ error: "author not deleted" });
        }
    }
);

//
// SQLITE EXAMPLES
// comment these out or they'll keep inserting every time you run your server
// if you get 'UNIQUE constraint failed' errors it's because
// this will keep inserting a row with the same primary key
// but the primary key should be unique
//

// insert example
// await db.run(
//     "INSERT INTO authors(id, name, bio) VALUES('1', 'Figginsworth III', 'A traveling gentleman.')"
// );
// await db.run(
//     "INSERT INTO books(id, author_id, title, pub_year, genre) VALUES ('1', '1', 'My Fairest Lady', '1866', 'romance')"
// );

// insert example with parameterized queries
// important to use parameterized queries to prevent SQL injection
// when inserting untrusted data
// let statement = await db.prepare(
//     "INSERT INTO books(id, author_id, title, pub_year, genre) VALUES (?, ?, ?, ?, ?)"
// );
// await statement.bind(["2", "1", "A Travelogue of Tales", "1867", "adventure"]);
// await statement.run();

// select examples
let authors = await db.all("SELECT * FROM authors");
console.log("Authors", authors);
let books = await db.all("SELECT * FROM books WHERE author_id = '1'");
console.log("Books", books);
let filteredBooks = await db.all("SELECT * FROM books WHERE pub_year = '1867'");

console.log("Some books", filteredBooks);

//
// EXPRESS EXAMPLES
//

// GET/POST/DELETE example
// interface Foo {
//     message: string;
// }
// interface Error {
//     error: string;
// }
// type FooResponse = Response<Foo | Error>;
// // res's type limits what responses this request handler can send
// // it must send either an object with a message or an error
// app.get("/foo", (req, res: FooResponse) => {
//     if (!req.query.bar) {
//         return res.status(400).json({ error: "bar is required" });
//     }
//     return res.json({ message: `You sent: ${req.query.bar} in the query` });
// });
// app.post("/foo", (req, res: FooResponse) => {
//     if (!req.body.bar) {
//         return res.status(400).json({ error: "bar is required" });
//     }
//     return res.json({ message: `You sent: ${req.body.bar} in the body` });
// });
// app.delete("/foo", (req, res) => {
//     // etc.
//     res.sendStatus(200);
// });

// //
// // ASYNC/AWAIT EXAMPLE
// //

// function sleep(ms: number) {
//     return new Promise((resolve) => setTimeout(resolve, ms));
// }
// // need async keyword on request handler to use await inside it
// app.get("/bar", async (req, res: FooResponse) => {
//     console.log("Waiting...");
//     // await is equivalent to calling sleep.then(() => { ... })
//     // and putting all the code after this in that func body ^
//     await sleep(3000);
//     // if we omitted the await, all of this code would execute
//     // immediately without waiting for the sleep to finish
//     console.log("Done!");
//     return res.sendStatus(200);
// });
// test it out! while server is running:
// curl http://localhost:3000/bar

// run server
let port = 3000;
let host = "localhost";
let protocol = "http";
app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
});
