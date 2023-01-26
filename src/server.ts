import express, { Response, Request, NextFunction } from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
    BookSchema,
    AuthorSchema,
    Book,
    Author,
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

function authorExist(){
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


const apiRouter = express.Router();


// Handlers
apiRouter.get("/book/:id?", async (req: Request, res: BookArrayResponse) => {
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
    } catch (e) {
        return res.status(400).json({ error: "query error" });
    }
});

apiRouter.post("/book", async (req: BookRequestBody, res: StringResponse) => {
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
    } catch (e) {
        res.status(400).json({ error: "insertion failed : book id exist" });
    }
});

apiRouter.delete("/book/:id", async (req: Request, res: StringResponse) => {
    const bkid: string = req.params.id;
    let statement = await db.prepare("delete from books where id=?");
    await statement.bind([bkid]);
    try {
        const result = await statement.run();
        if (result.changes === 0) {
            return res.status(400).json({ message: "nothing was deleted" });
        }
        return res.json({ message: "success book deleted" });
    } catch (e) {
        return res.status(400).json({ error: "delete failed" });
    }
});

apiRouter.get("/author", async (req: Request, res: AuthorArrayResponse) => {
    let allAuthor: Author[] = await db.all("select * from authors");
    return res.json({ authors: allAuthor });
});

apiRouter.get(
    "/author/:id",
    authorExist(),
    async (req: Request, res: AuthorArrayResponse) => {
        if (!res.locals.author) {
            return res.status(400).json({ error: "author don't exist" });
        }
        return res.json({ authors: [res.locals.author] });
    }
);

apiRouter.post("/author", async (req: AuthorRequestBody, res: StringResponse) => {
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
    }catch (e){
        res.status(400).json({ error: "insertion failed : author exist" }); // Only error I can think of
    }
});

apiRouter.delete(
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
        } catch (e) {
            return res.status(500).json({ error: "author not deleted" });
        }
    }
);

// run server
app.use("/api", apiRouter);
app.use(express.static("public"));


let port = 3000;
let host = "localhost";
let protocol = "http";
app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
});
