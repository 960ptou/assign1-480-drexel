import express, { Request } from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
    BookSchema,
    Book,
    BookRequestBody,
    BookArrayResponse,
    StringResponse,
} from "./types.js";

let router = express.Router();
router.use(express.json());

let authorRoute = express.Router();
authorRoute.use(express.json());
let db = await open({
    filename: "../database.db",
    driver: sqlite3.Database,
});
await db.get("PRAGMA foreign_keys = ON");


// Get /book:id
router.get("/book/:id", async (req: Request, res: BookArrayResponse) => {
    try {
        const bks = await db.get(
            "select * from books where id=?",
            [req.params.id]
        );
        if (bks === undefined){
            return res.status(403).json({error : "No book found with related Id"});
        }

        return res.json({books: [bks]});
    } catch (e) {
        return res.status(500).json({error : "DB query error"});
    }
})

// GET /book | /book?query
router.get("/book/:id?", async (req: Request, res: BookArrayResponse) => {
    let hasQuery: boolean = Object.keys(req.query).length > 0;
    let queryString: string = "select * from books";

    if (hasQuery) {
        queryString = `${queryString} where ${req.query["query"]}`.split(
            ";"
        )[0]; // avoid sql injection by removing all things append ';'
    }

    try {
        let bks: Book[] = await db.all(queryString);
        return res.json({ books: bks });
    } catch (e) {
        return res.status(500).json({ error: "DB query error" });
    }
});


// POST
router.post("/book", async (req: BookRequestBody, res: StringResponse) => {
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
        return res.status(400).json({ error: "author don't exist" });
    }

    // remove same id issue
    let bookWithSameId = await db.get("select * from books where id = ?", [bkid]);
    if (bookWithSameId){
        return res.status(400).json({ error: "insertion failed : book id exist"})
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
        res.status(500).json({ error: "DB query error" });
    }
});

// PUT -> Forcing ALL field https://www.mscharhag.com/api-design/updating-resources-put
// But it forces to do simular things like the delete button
router.put("/book", async (req: BookRequestBody, res: StringResponse) => {
    try {
        BookSchema.parse(req.body);
    } catch (e) {
        return res.status(403).json({ error: "book format invalid" });
    }

    const authorId: string = req.body.author_id;

    // forbid CHANGING if new author doesn't exist
    let author = await db.get("select * from authors where id = ?", [authorId]);
    if (!author) {
        return res.status(400).json({ error: "author don't exist" });
    }

    // inserting
    let updateStatement = await db.prepare(
        "update books set author_id = ?, title = ?, pub_year = ?, genre = ? where id = ?"
    );
    await updateStatement.bind([
        authorId,
        req.body.title,
        req.body.pub_year,
        req.body.genre,
        req.body.id,
    ]);

    try {
        await updateStatement.run();
        res.json({ message: "updated" });
    } catch (e) {
        res.status(500).json({ error: "DB query error" });
    }
});

// NOTE : THIS IS ONLY used for testing, REMOVE after actual depolyment
router.delete("/book",  async (req: Request, res: StringResponse) => {
    let statement = await db.prepare("delete from books");
    try {
        const result = await statement.run();
        if (result.changes === 0) {
            return res.status(400).json({ message: "No book was deleted" });
        }
        return res.json({ message: "all books deleted" });
    } catch (e) {
        res.status(500).json({ error: "DB query error" });
    }
});

// DELETE
router.delete("/book/:id", async (req: Request, res: StringResponse) => {
    const bkid: string = req.params.id;

    // In case book don't exist
    let bookWithSameId = await db.get("select * from books where id = ?", [bkid]);
    if (!bookWithSameId){
        return res.status(400).json({ error: "insertion failed : book doesn't exist"})
    }

    // Deleting
    let statement = await db.prepare("delete from books where id=?");
    await statement.bind([bkid]);
    try {
        const result = await statement.run();
        if (result.changes === 0) {
            return res.status(400).json({ message: "book wasn't delete" });
        }
        return res.json({ message: "success book deleted" });
    } catch (e) {
        res.status(500).json({ error: "DB query error" });
    }
});


export const bookRouter = router;